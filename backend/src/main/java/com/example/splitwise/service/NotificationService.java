package com.example.splitwise.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.splitwise.model.Activity;
import com.example.splitwise.model.Expense;
import com.example.splitwise.model.Notification;
import com.example.splitwise.repository.ActivityRepository;
import com.example.splitwise.repository.ExpenseRepository;
import com.example.splitwise.repository.NotificationRepository;
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

    @Autowired
    private ActivityService activityService;

    public List<Notification> getScheduledNotifications(String userId, String preferredCurrency) {
        
        List<Notification> newlyCreated = activityService
                .generateAndRecordSettlementReminders(userId, preferredCurrency);

        List<Notification> persisted = new ArrayList<>();
        try {
            persisted = notificationRepository.findByUserIdOrderByLastSentDesc(userId);
        } catch (Exception ignored) {}

        Map<String, Notification> latestByKey = new HashMap<>();
        for (Notification n : newlyCreated) mergeLatest(latestByKey, n);
        for (Notification n : persisted)    mergeLatest(latestByKey, n);

        List<Notification> merged = new ArrayList<>(latestByKey.values());

        List<Activity> unreadActivities = new ArrayList<>();
        try {
            unreadActivities = activityRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        } catch (Exception ignored) {}

        Set<String> mappedActivityIds = new HashSet<>();
        for (Notification n : merged) {
            if (n.getActivityId() != null && !n.getActivityId().isBlank()) {
                mappedActivityIds.add(n.getActivityId());
            }
            if (n.getId() != null && !n.getId().isBlank()) {
                mappedActivityIds.add(n.getId());
            }
        }

        for (Activity act : unreadActivities) {
            if (!mappedActivityIds.contains(act.getId())) {
                Notification mapped = mapActivityToNotification(act);
                if (mapped != null) {
                    merged.add(mapped);
                }
            }
        }

        merged.sort(Comparator.comparing(this::notificationInstant).reversed());
        return merged;
    }

    public List<Notification> getUnreadNotifications(String userId, String preferredCurrency) {
        List<Notification> all = getScheduledNotifications(userId, preferredCurrency);
        List<Notification> unread = new ArrayList<>();
        for (Notification n : all) {
            if (n != null && !n.isRead()) unread.add(n);
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

    public long countReadNotifications(String userId) {
        return notificationRepository.countByUserIdAndReadTrue(userId);
    }

    public void markNotificationsRead(String userId, List<String> notificationIds) {
        if (userId == null || userId.isBlank() || notificationIds == null || notificationIds.isEmpty()) return;

        List<String> activityIds = new ArrayList<>();

        for (String id : notificationIds) {
            if (id == null || id.isBlank()) continue;
            try {
                Optional<Notification> opt = notificationRepository.findById(id);
                if (opt.isPresent()) {
                    Notification n = opt.get();
                    if (userId.equals(n.getUserId()) && !n.isRead()) {
                        n.setRead(true);
                        notificationRepository.save(n);
                    }
                    if (n.getActivityId() != null && !n.getActivityId().isBlank()) {
                        activityIds.add(n.getActivityId());
                    }
                }
            } catch (Exception ignored) {}

            activityIds.add(id);
        }

        if (!activityIds.isEmpty()) {
            activityService.markActivitiesRead(userId, activityIds);
        }
    }

    public Map<String, Object> sendReminderToFriend(String userId, String friendId) {
        List<Expense> expenses = expenseRepository.findByBothParticipants(userId, friendId);
        logger.info("[sendReminderToFriend] userId={}, friendId={}, found {} expenses",
                userId, friendId, expenses.size());

        String payerName = userRepository.findById(userId).map(u -> u.getName()).orElse("Someone");
        int sentCount = 0;
        List<String> notificationIds = new ArrayList<>();

        for (Expense expense : expenses) {
            if (!userId.equals(expense.getPayerId())) continue;
            if (expense.getParticipantIds() == null || !expense.getParticipantIds().contains(friendId)) continue;
            if (expense.getExpenseStatus() == Expense.ExpenseStatus.Settled) continue;
            if (Boolean.TRUE.equals(expense.getSettledByUser() != null
                    ? expense.getSettledByUser().get(friendId) : null)) continue;

            BigDecimal owedAmount = expenseService.getOwedAmount(expense, friendId);
            if (owedAmount == null || owedAmount.compareTo(BigDecimal.ZERO) <= 0) continue;

            String currency = expense.getCurrency() == null || expense.getCurrency().isBlank()
                    ? "INR" : expense.getCurrency().toUpperCase();
            String normalizedAmount = owedAmount.setScale(2, RoundingMode.HALF_UP).toPlainString();
            String message = "Reminder: You owe " + payerName + " " + currency + " " + normalizedAmount
                    + " for \"" + expense.getDescription() + "\".";

            Notification saved = activityService.recordManualReminder(userId, friendId, expense, message);
            notificationIds.add(saved.getId());
            logger.info("[sendReminderToFriend] reminder written friendId={} expenseId={}", friendId, expense.getId());
            sentCount++;
        }

        Map<String, Object> result = new HashMap<>();
        result.put("sent", sentCount);
        result.put("notificationIds", notificationIds);
        return result;
    }

    private String notificationKey(Notification n) {
        if (n == null) return "";
        return n.getUserId() + "|" + n.getExpenseId() + "|" + n.getType();
    }

    private Instant notificationInstant(Notification n) {
        if (n == null) return Instant.EPOCH;
        if (n.getLastSent() != null) return n.getLastSent();
        if (n.getCreatedAt() != null) return n.getCreatedAt();
        return Instant.EPOCH;
    }

    private void mergeLatest(Map<String, Notification> bucket, Notification candidate) {
        if (candidate == null) return;
        String key = notificationKey(candidate);
        Notification existing = bucket.get(key);
        if (existing == null || notificationInstant(candidate).isAfter(notificationInstant(existing))) {
            bucket.put(key, candidate);
        }
    }

    private Notification mapActivityToNotification(Activity act) {
        if (act == null) return null;
        Notification.Type notifType = Notification.Type.OWE;
        if (act.getType() == Activity.ActivityType.SETTLEMENT_REMINDER && act.getNotificationType() != null) {
            try {
                notifType = Notification.Type.valueOf(act.getNotificationType().toUpperCase());
            } catch (Exception ignored) {}
        } else {
            try {
                notifType = Notification.Type.valueOf(act.getType().name());
            } catch (Exception ignored) {}
        }

        Notification n = new Notification(
                act.getUserId(),
                act.getRelatedExpenseId(),
                notifType,
                act.getDescription(),
                act.getCreatedAt() != null ? act.getCreatedAt() : Instant.now()
        );
        n.setId(act.getId());
        n.setRead(act.isRead());
        n.setActivityId(act.getId());
        return n;
    }
}