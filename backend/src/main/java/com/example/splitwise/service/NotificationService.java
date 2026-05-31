package com.example.splitwise.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.Comparator;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.example.splitwise.model.Expense;
import com.example.splitwise.model.Notification;
import com.example.splitwise.model.Activity;
import com.example.splitwise.model.User;
import com.example.splitwise.repository.ExpenseRepository;
import com.example.splitwise.repository.NotificationRepository;
import com.example.splitwise.repository.ActivityRepository;
import com.example.splitwise.repository.UserRepository;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired
    private ExpenseRepository expenseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ActivityRepository activityRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private volatile Map<String, Object> cachedExchangeRates = new ConcurrentHashMap<>();
    private volatile Instant cachedExchangeRatesAt = Instant.EPOCH;
    private static final Duration EXCHANGE_RATE_CACHE_TTL = Duration.ofMinutes(30);

        private boolean isUnsettled(Expense e) {
        if (e.getParticipantIds() == null || e.getParticipantIds().isEmpty()) {
            return false;
        }
        if (e.getSettledByUser() != null && !e.getSettledByUser().isEmpty()) {
            for (String pid : e.getParticipantIds()) {
                if (pid == null || pid.equals(e.getPayerId())) continue;
                if (!Boolean.TRUE.equals(e.getSettledByUser().get(pid))) {
                    return true;
                }
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

        private String notificationKey(Notification n) {
        if (n == null) return "";
        return String.valueOf(n.getUserId()) + "|" +
                String.valueOf(n.getExpenseId()) + "|" +
                String.valueOf(n.getType());
    }

    private Instant notificationInstant(Notification n) {
        if (n == null) return Instant.EPOCH;
        if (n.getLastSent() != null) return n.getLastSent();
        if (n.getCreatedAt() != null) return n.getCreatedAt();
        return Instant.EPOCH;
    }

    private void mergeLatestNotification(Map<String, Notification> bucket, Notification candidate) {
        if (candidate == null) return;
        String key = notificationKey(candidate);
        Notification existing = bucket.get(key);
        if (existing == null || notificationInstant(candidate).isAfter(notificationInstant(existing))) {
            bucket.put(key, candidate);
        }
    }

    public List<Notification> getScheduledNotifications(String userId, String preferredCurrency) {
        List<Notification> responseNotifications = new ArrayList<>();
        try {
            String effectivePreferredCurrency = preferredCurrency == null || preferredCurrency.isBlank()
                    ? "INR"
                    : preferredCurrency.toUpperCase();
            Optional<User> userOpt = userRepository.findById(userId);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                if (user.getSettlementReminderEnabled()) {
                    int delay = user.getRemainderDelays();
                    Map<String, Instant> lastNotificationSent = user.getLastNotificationSent();
                    if (lastNotificationSent == null) {
                        lastNotificationSent = new HashMap<>();
                    }
                    Instant now = Instant.now();
                    Set<String> addedExpenseIds = new HashSet<>();

                    List<Expense> expenses = expenseRepository.findByPayerId(userId);
                    for (Expense e : expenses) {
                        if (e == null || e.getId() == null || e.getParticipantIds() == null || e.getParticipantIds().isEmpty()) {
                            continue;
                        }
                        if (!isUnsettled(e)) {
                            continue;
                        }
                        try {
                            Instant createdAt = e.getCreatedAt() == null ? now : e.getCreatedAt();
                            Instant time = lastNotificationSent.getOrDefault(e.getId(), createdAt);
                            if (!time.plusSeconds(delay * 86400L).isBefore(now)) {
                                continue;
                            }

                            lastNotificationSent.put(e.getId(), now);
                            long seconds = Math.max(0, Duration.between(createdAt, now).getSeconds());
                            long days = seconds / 86400;
                            BigDecimal amount = e.getParticipantIds().stream()
                                    .filter(pid -> pid != null && !pid.equals(e.getPayerId()))
                                    .filter(pid -> !(e.getSettledByUser() != null && e.getSettledByUser().getOrDefault(pid, false)))
                                    .map(pid -> expenseService.getOwedAmount(e, pid))
                                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                                continue;
                            }

                                BigDecimal convertedAmount = convertAmount(amount, e.getCurrency(), effectivePreferredCurrency);

                            Notification n = new Notification(
                                    userId,
                                    e.getId(),
                                    Notification.Type.OWED,
                                    buildNotificationMessage(
                                        "Expense " + e.getDescription() + " created " + days + " ago. Amount other owe to you ",
                                        amount,
                                        e.getCurrency(),
                                        convertedAmount,
                                        effectivePreferredCurrency
                                    ),
                                    now
                            );
                            try {
                                Notification savedNotification = notificationRepository.save(n);
                                responseNotifications.add(savedNotification);
                                addedExpenseIds.add(e.getId());
                            } catch (Exception ignored) { }
                            
                        } catch (Exception ignored) {
                            
                        }
                    }

                    expenses = expenseRepository.findByParticipantIdsContaining(userId);
                    for (Expense e : expenses) {
                        if (e == null || e.getId() == null) {
                            continue;
                        }
                        if (!isUserStillOwing(e, userId)) {
                            continue;
                        }
                        try {
                            Instant createdAt = e.getCreatedAt() == null ? now : e.getCreatedAt();
                            Instant time = lastNotificationSent.getOrDefault(e.getId(), createdAt);
                            if (!time.plusSeconds(delay * 86400L).isBefore(now)) {
                                continue;
                            }

                            lastNotificationSent.put(e.getId(), now);
                            long seconds = Math.max(0, Duration.between(createdAt, now).getSeconds());
                            long days = seconds / 86400;
                            BigDecimal amount = expenseService.getOwedAmount(e, userId);
                            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                                continue;
                            }

                            BigDecimal convertedAmount = convertAmount(amount, e.getCurrency(), effectivePreferredCurrency);
                            Notification n = new Notification(
                                    userId,
                                    e.getId(),
                                    Notification.Type.OWE,
                                    buildNotificationMessage(
                                        "Expense " + e.getDescription() + " created " + days + " ago. Amount you owe ",
                                        amount,
                                        e.getCurrency(),
                                        convertedAmount,
                                        effectivePreferredCurrency
                                    ),
                                    now
                            );
                            try {
                                Notification savedNotification = notificationRepository.save(n);
                                responseNotifications.add(savedNotification);
                                addedExpenseIds.add(e.getId());
                            } catch (Exception ignored) { }
                        } catch (Exception ignored) {
                            
                        }
                    }

                    appendFallbackOverdueNotifications(userId, delay, now, responseNotifications, addedExpenseIds, effectivePreferredCurrency);

                    user.setLastNotificationSent(lastNotificationSent);
                    userRepository.save(user);
                }
            }
        } catch (Exception ignored) {
            
        }

        List<Notification> persisted = new ArrayList<>();
        try {
            persisted = notificationRepository.findByUserIdOrderByLastSentDesc(userId);
        } catch (Exception ignored) {
        }

        Map<String, Notification> latestByExpenseAndType = new HashMap<>();
        for (Notification n : responseNotifications) {
            mergeLatestNotification(latestByExpenseAndType, n);
        }
        for (Notification n : persisted) {
            mergeLatestNotification(latestByExpenseAndType, n);
        }

        List<Notification> merged = new ArrayList<>(latestByExpenseAndType.values());
        merged.sort(Comparator.comparing(this::notificationInstant).reversed());
        return merged;
    }

    public List<Notification> getUnreadNotifications(String userId, String preferredCurrency) {
        List<Notification> merged = getScheduledNotifications(userId, preferredCurrency);
        List<Notification> unread = new ArrayList<>();
        for (Notification n : merged) {
            if (n != null && !n.isRead()) {
                unread.add(n);
            }
        }
        unread.sort(Comparator.comparing(this::notificationInstant).reversed());
        return unread;
    }

    public List<Notification> getReadNotifications(String userId, int page, int size) {
        int safePage = Math.max(0, page);
        int safeSize = Math.max(1, Math.min(size, 50));
        Pageable pageable = PageRequest.of(safePage, safeSize);
        return notificationRepository.findByUserIdAndReadTrueOrderByLastSentDesc(userId, pageable);
    }

    public Map<String, Object> sendReminderToFriend(String userId, String friendId) {
        List<Expense> expenses = expenseRepository.findByBothParticipants(userId, friendId);
        logger.info("[sendReminderToFriend] userId={}, friendId={}, found {} expenses", userId, friendId, expenses.size());
        String payerName = userRepository.findById(userId).map(u -> u.getName()).orElse("Someone");
        Instant now = Instant.now();
        int sentCount = 0;
        List<String> notificationIds = new ArrayList<>();

        for (Expense expense : expenses) {
            logger.info("[sendReminderToFriend] Checking expenseId={}, payerId={}, participants={}, status={}, settledByUser={}",
                    expense.getId(), expense.getPayerId(), expense.getParticipantIds(), expense.getExpenseStatus(), expense.getSettledByUser());
            if (!userId.equals(expense.getPayerId())) {
                logger.info("[sendReminderToFriend] Skipping expense {}: user is not payer", expense.getId());
                continue;
            }
            if (expense.getParticipantIds() == null || !expense.getParticipantIds().contains(friendId)) {
                logger.info("[sendReminderToFriend] Skipping expense {}: friend not a participant", expense.getId());
                continue;
            }
            if (expense.getExpenseStatus() == Expense.ExpenseStatus.Settled) {
                logger.info("[sendReminderToFriend] Skipping expense {}: already settled", expense.getId());
                continue;
            }
            if (Boolean.TRUE.equals(expense.getSettledByUser() != null ? expense.getSettledByUser().get(friendId) : null)) {
                logger.info("[sendReminderToFriend] Skipping expense {}: friend already settled", expense.getId());
                continue;
            }

            BigDecimal owedAmount = expenseService.getOwedAmount(expense, friendId);
            if (owedAmount == null || owedAmount.compareTo(BigDecimal.ZERO) <= 0) {
                logger.info("[sendReminderToFriend] Skipping expense {}: owedAmount is zero or negative", expense.getId());
                continue;
            }

            String expenseCurrency = expense.getCurrency() == null || expense.getCurrency().isBlank()
                    ? "INR"
                    : expense.getCurrency().toUpperCase();
            String normalizedAmount = owedAmount.setScale(2, RoundingMode.HALF_UP).toPlainString();
            String message = "Reminder: You owe " + payerName + " " + expenseCurrency + " " + normalizedAmount
                    + " for \"" + expense.getDescription() + "\".";

            Notification notification = new Notification(friendId, expense.getId(), Notification.Type.OWE, message, now);
            Notification savedNotification = notificationRepository.save(notification);
            notificationIds.add(savedNotification.getId());
            logger.info("[sendReminderToFriend] Notification created for friendId={}, expenseId={}", friendId, expense.getId());
            try {
                if (activityRepository != null && !activityRepository.existsByRelatedExpenseIdAndUserIdAndType(expense.getId(), friendId, Activity.ActivityType.EXPENSE_OWED)) {
                    Activity a = new Activity();
                    a.setUserId(friendId);
                    a.setType(Activity.ActivityType.EXPENSE_OWED);
                    a.setRelatedExpenseId(expense.getId());
                    a.setDescription("You owe " + expenseCurrency + " " + normalizedAmount + " to " + payerName + " for \"" + expense.getDescription() + "\".");
                    activityRepository.save(a);
                    logger.info("[sendReminderToFriend] Activity created for friendId={}, expenseId={}", friendId, expense.getId());
                }
            } catch (Exception ex) {
                logger.warn("[sendReminderToFriend] Failed to create activity for friendId={}, expenseId={}, ex={}", friendId, expense.getId(), ex.getMessage());
            }
            sentCount++;
        }

        logger.info("[sendReminderToFriend] Total reminders sent: {}", sentCount);
        Map<String, Object> result = new HashMap<>();
        result.put("sent", sentCount);
        result.put("notificationIds", notificationIds);
        return result;
    }

    public long countReadNotifications(String userId) {
        return notificationRepository.countByUserIdAndReadTrue(userId);
    }

    public void markNotificationsRead(String userId, List<String> notificationIds) {
        if (userId == null || userId.isBlank() || notificationIds == null || notificationIds.isEmpty()) {
            return;
        }
        for (String notificationId : notificationIds) {
            if (notificationId == null || notificationId.isBlank()) {
                continue;
            }
            try {
                Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
                if (notificationOpt.isEmpty()) {
                    continue;
                }
                Notification notification = notificationOpt.get();
                if (!userId.equals(notification.getUserId())) {
                    continue;
                }
                if (!notification.isRead()) {
                    notification.setRead(true);
                    notificationRepository.save(notification);
                }
            } catch (Exception ignored) {
            }
        }
    }

    private void appendFallbackOverdueNotifications(
            String userId,
            int delay,
            Instant now,
            List<Notification> out,
            Set<String> addedExpenseIds,
            String preferredCurrency
    ) {
        try {
            for (Expense e : expenseRepository.findByPayerId(userId)) {
                if (e == null || e.getId() == null || addedExpenseIds.contains(e.getId()) || !isUnsettled(e)) 
                    continue;
                Instant createdAt = e.getCreatedAt() == null ? now : e.getCreatedAt();
                if (!createdAt.plusSeconds(delay * 86400L).isBefore(now)) 
                    continue;
                BigDecimal amount = e.getParticipantIds().stream()
                        .filter(pid -> pid != null && !pid.equals(e.getPayerId()))
                        .filter(pid -> !(e.getSettledByUser() != null && e.getSettledByUser().getOrDefault(pid, false)))
                        .map(pid -> expenseService.getOwedAmount(e, pid))
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                if (amount.compareTo(BigDecimal.ZERO) <= 0) 
                    continue;
                BigDecimal convertedAmount = convertAmount(amount, e.getCurrency(), preferredCurrency);
                Notification n = new Notification(userId, e.getId(), Notification.Type.OWED,
                        buildNotificationMessage(
                                "Expense " + e.getDescription() + " is overdue. Amount others owe to you ",
                                amount,
                                e.getCurrency(),
                                convertedAmount,
                                preferredCurrency
                        ), now);
                try {
                    Notification savedNotification = notificationRepository.save(n);
                    out.add(savedNotification);
                    addedExpenseIds.add(e.getId());
                } catch (Exception ignored) {
                }
            }
            for (Expense e : expenseRepository.findByParticipantIdsContaining(userId)) {
                if (e == null || e.getId() == null || addedExpenseIds.contains(e.getId()) || !isUserStillOwing(e, userId)) continue;
                Instant createdAt = e.getCreatedAt() == null ? now : e.getCreatedAt();
                if (!createdAt.plusSeconds(delay * 86400L).isBefore(now)) continue;
                BigDecimal amount = expenseService.getOwedAmount(e, userId);
                if (amount.compareTo(BigDecimal.ZERO) <= 0) continue;
                BigDecimal convertedAmount = convertAmount(amount, e.getCurrency(), preferredCurrency);
                Notification n = new Notification(userId, e.getId(), Notification.Type.OWE,
                        buildNotificationMessage(
                                "Expense " + e.getDescription() + " is overdue. Amount you owe ",
                                amount,
                                e.getCurrency(),
                                convertedAmount,
                                preferredCurrency
                        ), now);
                try {
                    Notification savedNotification = notificationRepository.save(n);
                    out.add(savedNotification);
                    addedExpenseIds.add(e.getId());
                } catch (Exception ignored) {
                }
            }
        } catch (Exception ignored) {
        }
    }

    private String buildNotificationMessage(
            String prefix,
            BigDecimal sourceAmount,
            String sourceCurrency,
            BigDecimal preferredAmount,
            String preferredCurrency
    ) {
        String normalizedSourceCurrency = sourceCurrency == null || sourceCurrency.isBlank() ? "INR" : sourceCurrency.toUpperCase();
        String normalizedPreferredCurrency = preferredCurrency == null || preferredCurrency.isBlank() ? "INR" : preferredCurrency.toUpperCase();
        BigDecimal safePreferredAmount = preferredAmount == null ? sourceAmount : preferredAmount;
        return prefix
                + normalizedSourceCurrency + " " + sourceAmount.setScale(2, RoundingMode.HALF_UP)
                + " (" + normalizedPreferredCurrency + " " + safePreferredAmount.setScale(2, RoundingMode.HALF_UP) + ")";
    }

    private BigDecimal convertAmount(BigDecimal amount, String sourceCurrency, String targetCurrency) {
        if (amount == null) return BigDecimal.ZERO;
        String source = sourceCurrency == null || sourceCurrency.isBlank() ? "INR" : sourceCurrency.toUpperCase();
        String target = targetCurrency == null || targetCurrency.isBlank() ? "INR" : targetCurrency.toUpperCase();
        if (source.equals(target)) {
            return amount;
        }
        try {
            Map<String, Object> rates = getExchangeRates();
            if (rates == null || rates.isEmpty()) {
                return amount;
            }
            BigDecimal sourceRate = readRate(rates, source);
            BigDecimal targetRate = readRate(rates, target);
            if (sourceRate == null || targetRate == null || sourceRate.compareTo(BigDecimal.ZERO) == 0) {
                return amount;
            }
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
                if (data == null) {
                    return cachedExchangeRates;
                }
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