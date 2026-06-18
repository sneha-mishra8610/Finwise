package com.example.splitwise.service;
import com.example.splitwise.model.Activity;
import com.example.splitwise.model.Expense;
import com.example.splitwise.model.Notification;
import com.example.splitwise.model.User;
import com.example.splitwise.repository.ActivityRepository;
import com.example.splitwise.repository.ExpenseRepository;
import com.example.splitwise.repository.NotificationRepository;
import com.example.splitwise.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ActivityService {
    private static final Logger logger = LoggerFactory.getLogger(ActivityService.class);
    @Autowired
    private ActivityRepository activityRepository;
    @Autowired
    private NotificationRepository notificationRepository;
    @Autowired
    private ExpenseRepository expenseRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ExpenseService expenseService;

    private final RestTemplate restTemplate = new RestTemplate();
    private volatile Map<String, Object> cachedExchangeRates = new ConcurrentHashMap<>();
    private volatile Instant cachedExchangeRatesAt = Instant.EPOCH;
    private static final Duration EXCHANGE_RATE_CACHE_TTL = Duration.ofMinutes(30);

    public List<Notification> generateAndRecordSettlementReminders(String userId, String preferredCurrency) {
        List<Notification> created = new ArrayList<>();
        try {
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isEmpty()) return created;
            User user = userOpt.get();
            if (!user.getSettlementReminderEnabled()) return created;
            int delayDays = user.getRemainderDelays();
            Instant now = Instant.now();
            String effectiveCurrency = (preferredCurrency == null || preferredCurrency.isBlank())
                    ? "INR" : preferredCurrency.toUpperCase();

            for (Expense e : expenseRepository.findByPayerId(userId)) {
                if (!isUnsettled(e)) continue;
                try {
                    created.addAll(
                        generatePayerReminder(userId, e, delayDays, now, effectiveCurrency)
                    );
                } catch (Exception ex) {
                    logger.warn("[ActivityService] payer reminder failed expenseId={}: {}", e.getId(), ex.getMessage());
                }
            }

            for (Expense e : expenseRepository.findByParticipantIdsContaining(userId)) {
                if (!isUserStillOwing(e, userId)) continue;
                try {
                    created.addAll(
                        generateParticipantReminder(userId, e, delayDays, now, effectiveCurrency)
                    );
                } catch (Exception ex) {
                    logger.warn("[ActivityService] participant reminder failed expenseId={}: {}", e.getId(), ex.getMessage());
                }
            }
        } catch (Exception ex) {
            logger.error("[ActivityService] generateAndRecordSettlementReminders failed for userId={}: {}", userId, ex.getMessage());
        }
        return created;
    }

    public List<Activity> getUnreadActivities(String userId) {
        return activityRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
    }

    public long countUnreadActivities(String userId) {
        return activityRepository.countByUserIdAndReadFalse(userId);
    }

    public void markActivitiesRead(String userId, List<String> activityIds) {
        if (userId == null || activityIds == null || activityIds.isEmpty()) return;
        List<Activity> toMark = activityRepository.findByUserIdAndIdIn(userId, activityIds);
        for (Activity a : toMark) {
            if (!a.isRead()) {
                a.setRead(true);
                activityRepository.save(a);
            }
        }

        for (String actId : activityIds) {
            if (actId == null || actId.isBlank()) continue;
            try {
                List<Notification> paired = notificationRepository.findByActivityId(actId);
                for (Notification n : paired) {
                    if (!n.isRead()) {
                        n.setRead(true);
                        notificationRepository.save(n);
                    }
                }
            } catch (Exception ignored) {}
        }
    }

    private List<Notification> generatePayerReminder(
            String userId, Expense e, int delayDays, Instant now, String preferredCurrency) {
        List<Notification> out = new ArrayList<>();
        if (e.getId() == null) return out;

        Instant referencePoint = getReferencePoint(userId, e);
        if (!isDue(referencePoint, delayDays, now)) return out;

        BigDecimal totalOwed = calculateTotalOwedToPayer(e);
        if (totalOwed.compareTo(BigDecimal.ZERO) <= 0) return out;
        BigDecimal converted = convertAmount(totalOwed, e.getCurrency(), preferredCurrency);
        long daysSince = Duration.between(e.getCreatedAt() != null ? e.getCreatedAt() : now, now).toDays();
        String desc = buildReminderDescription(
                "Expense \"" + e.getDescription() + "\" created " + daysSince + " day(s) ago. "
                + "Others still owe you ",
                totalOwed, e.getCurrency(), converted, preferredCurrency);

        Activity activity = new Activity();
        activity.setUserId(userId);
        activity.setType(Activity.ActivityType.SETTLEMENT_REMINDER);
        activity.setRelatedExpenseId(e.getId());
        activity.setDescription(desc);
        activity.setRead(false);
        activity.setNotificationType("OWED");
        activity.setCreatedAt(now);
        Activity savedActivity = activityRepository.save(activity);
        Notification n = new Notification(userId, e.getId(), Notification.Type.OWED, desc, now);
        n.setActivityId(savedActivity.getId());
        Notification savedNotif = notificationRepository.save(n);
        out.add(savedNotif);
        logger.info("[ActivityService] OWED reminder written userId={} expenseId={}", userId, e.getId());
        return out;
    }

    private List<Notification> generateParticipantReminder(
            String userId, Expense e, int delayDays, Instant now, String preferredCurrency) {
        List<Notification> out = new ArrayList<>();
        if (e.getId() == null) return out;
        Instant referencePoint = getReferencePoint(userId, e);
        if (!isDue(referencePoint, delayDays, now)) return out;
        BigDecimal owed = expenseService.getOwedAmount(e, userId);
        if (owed.compareTo(BigDecimal.ZERO) <= 0) return out;
        BigDecimal converted = convertAmount(owed, e.getCurrency(), preferredCurrency);
        long daysSince = Duration.between(e.getCreatedAt() != null ? e.getCreatedAt() : now, now).toDays();
        String desc = buildReminderDescription(
                "Expense \"" + e.getDescription() + "\" created " + daysSince + " day(s) ago. "
                + "You still owe ",
                owed, e.getCurrency(), converted, preferredCurrency);

        Activity activity = new Activity();
        activity.setUserId(userId);
        activity.setType(Activity.ActivityType.SETTLEMENT_REMINDER);
        activity.setRelatedExpenseId(e.getId());
        activity.setDescription(desc);
        activity.setRead(false);
        activity.setNotificationType("OWE");
        activity.setCreatedAt(now);
        Activity savedActivity = activityRepository.save(activity);

        Notification n = new Notification(userId, e.getId(), Notification.Type.OWE, desc, now);
        n.setActivityId(savedActivity.getId());
        Notification savedNotif = notificationRepository.save(n);
        out.add(savedNotif);
        logger.info("[ActivityService] OWE reminder written userId={} expenseId={}", userId, e.getId());
        return out;
    }

    public Notification recordManualReminder(
            String payerUserId, String friendId, Expense expense, String message) {
        Instant now = Instant.now();
        Activity activity = new Activity();
        activity.setUserId(friendId);
        activity.setType(Activity.ActivityType.SETTLEMENT_REMINDER);
        activity.setRelatedExpenseId(expense.getId());
        activity.setDescription(message);
        activity.setRead(false);
        activity.setNotificationType("OWE");
        activity.setCreatedAt(now);
        Activity savedActivity = activityRepository.save(activity);
        // Paired Notification
        Notification notification = new Notification(
                friendId, expense.getId(), Notification.Type.OWE, message, now);
        notification.setActivityId(savedActivity.getId());
        return notificationRepository.save(notification);
    }

    private Instant getReferencePoint(String userId, Expense expense) {
        Optional<Activity> latest = activityRepository
                .findTopByUserIdAndRelatedExpenseIdAndTypeOrderByCreatedAtDesc(
                        userId, expense.getId(), Activity.ActivityType.SETTLEMENT_REMINDER);
        if (latest.isPresent() && latest.get().getCreatedAt() != null) {
            return latest.get().getCreatedAt();
        }
        return expense.getCreatedAt() != null ? expense.getCreatedAt() : Instant.now();
    }

    private boolean isDue(Instant referencePoint, int delayDays, Instant now) {
        return referencePoint.plusSeconds(delayDays * 86400L).isBefore(now);
    }
    private boolean isUnsettled(Expense e) {
        if (e.getParticipantIds() == null || e.getParticipantIds().isEmpty()) return false;
        if (e.getSettledByUser() != null && !e.getSettledByUser().isEmpty()) {
            for (String pid : e.getParticipantIds()) {
                if (pid == null || pid.equals(e.getPayerId())) continue;
                if (!Boolean.TRUE.equals(e.getSettledByUser().get(pid))) return true;
            }
            return false;
        }
        return e.getExpenseStatus() == Expense.ExpenseStatus.Unsettled;
    }
    private boolean isUserStillOwing(Expense e, String userId) {
        if (e == null || userId == null) return false;
        if (userId.equals(e.getPayerId())) return false;
        if (e.getParticipantIds() == null || !e.getParticipantIds().contains(userId)) return false;
        if (e.getSettledByUser() != null && e.getSettledByUser().containsKey(userId)) {
            return !Boolean.TRUE.equals(e.getSettledByUser().get(userId));
        }
        return e.getExpenseStatus() == Expense.ExpenseStatus.Unsettled;
    }
    private BigDecimal calculateTotalOwedToPayer(Expense e) {
        if (e.getParticipantIds() == null) return BigDecimal.ZERO;
        return e.getParticipantIds().stream()
                .filter(pid -> pid != null && !pid.equals(e.getPayerId()))
                .filter(pid -> !(e.getSettledByUser() != null && Boolean.TRUE.equals(e.getSettledByUser().get(pid))))
                .map(pid -> expenseService.getOwedAmount(e, pid))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    private String buildReminderDescription(
            String prefix,
            BigDecimal sourceAmount, String sourceCurrency,
            BigDecimal preferredAmount, String preferredCurrency) {
        String src = sourceCurrency == null || sourceCurrency.isBlank() ? "INR" : sourceCurrency.toUpperCase();
        String pref = preferredCurrency == null || preferredCurrency.isBlank() ? "INR" : preferredCurrency.toUpperCase();
        BigDecimal safePreferred = preferredAmount == null ? sourceAmount : preferredAmount;
        return prefix
                + src + " " + sourceAmount.setScale(2, RoundingMode.HALF_UP)
                + " (" + pref + " " + safePreferred.setScale(2, RoundingMode.HALF_UP) + ")";
    }
    BigDecimal convertAmount(BigDecimal amount, String sourceCurrency, String targetCurrency) {
        if (amount == null) return BigDecimal.ZERO;
        String source = sourceCurrency == null || sourceCurrency.isBlank() ? "INR" : sourceCurrency.toUpperCase();
        String target = targetCurrency == null || targetCurrency.isBlank() ? "INR" : targetCurrency.toUpperCase();
        if (source.equals(target)) return amount;
        try {
            Map<String, Object> rates = getExchangeRates();
            if (rates == null || rates.isEmpty()) return amount;
            BigDecimal sourceRate = readRate(rates, source);
            BigDecimal targetRate = readRate(rates, target);
            if (sourceRate == null || targetRate == null || sourceRate.compareTo(BigDecimal.ZERO) == 0) return amount;
            return amount.multiply(targetRate).divide(sourceRate, 2, RoundingMode.HALF_UP);
        } catch (Exception ignored) {
            return amount;
        }
    }
    private Map<String, Object> getExchangeRates() {
        Instant now = Instant.now();
        if (!cachedExchangeRates.isEmpty() && Duration.between(cachedExchangeRatesAt, now).compareTo(EXCHANGE_RATE_CACHE_TTL) < 0) {
            return cachedExchangeRates;
        }
        synchronized (this) {
            now = Instant.now();
            if (!cachedExchangeRates.isEmpty() && Duration.between(cachedExchangeRatesAt, now).compareTo(EXCHANGE_RATE_CACHE_TTL) < 0) {
                return cachedExchangeRates;
            }
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = restTemplate.getForObject("https://api.exchangerate-api.com/v4/latest/INR", Map.class);
                if (data == null) return cachedExchangeRates;
                Object ratesObj = data.get("rates");
                if (ratesObj instanceof Map<?, ?> rates) {
                    Map<String, Object> normalized = new HashMap<>();
                    for (Map.Entry<?, ?> entry : rates.entrySet()) {
                        if (entry.getKey() != null && entry.getValue() != null) {
                            normalized.put(String.valueOf(entry.getKey()).toUpperCase(), entry.getValue());
                        }
                    }
                    cachedExchangeRates = normalized;
                    cachedExchangeRatesAt = now;
                }
            } catch (Exception ignored) {
                return cachedExchangeRates;
            }
            return cachedExchangeRates;
        }
    }
    private BigDecimal readRate(Map<?, ?> rates, String currency) {
        if (rates == null || currency == null) return null;
        Object value = rates.get(currency);
        if (value == null) return null;
        try {
            return new BigDecimal(String.valueOf(value));
        } catch (NumberFormatException ex) {
            return null;
        }
    }
}
