package com.example.splitwise.service;

import com.example.splitwise.model.Activity;
import com.example.splitwise.model.Expense;
import com.example.splitwise.repository.ActivityRepository;
import com.example.splitwise.repository.ExpenseRepository;
import com.example.splitwise.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ExpenseService(ExpenseRepository expenseRepository, ActivityRepository activityRepository,
                          UserRepository userRepository, NotificationService notificationService) {
        this.expenseRepository = expenseRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public Expense createExpense(Expense expense) {
        if (expense.getId() != null && expense.getId().isBlank()) {
            expense.setId(null);
        }
        normalizeExpense(expense);
        validateCustomSplits(expense);

        Expense saved = expenseRepository.save(expense);

        recordAndNotify(expense.getPayerId(), saved, Activity.ActivityType.EXPENSE_ADDED, "added");
        recordOwedActivities(saved);

        return saved;
    }

    public Expense updateExpense(Expense expense) {
        normalizeExpense(expense);
        validateCustomSplits(expense);

        Expense saved = expenseRepository.save(expense);

        recordAndNotify(expense.getPayerId(), saved, Activity.ActivityType.EXPENSE_UPDATED, "updated");

        return saved;
    }

    private void validateCustomSplits(Expense expense){
        if(expense.getCustomSplits()==null||expense.getCustomSplits().isEmpty())
            return;
        BigDecimal total=expense.getCustomSplits().values().stream().reduce(BigDecimal.ZERO,BigDecimal::add);
        if(total.compareTo(expense.getAmount())!=0){
            throw new IllegalArgumentException(
                "Splits ("+total+") must add up to "+expense.getAmount()+")"
            );
        }
    }

    public void deleteExpense(String id) {
        expenseRepository.findById(id).ifPresent(expense -> {
            expenseRepository.deleteById(id);
            recordAndNotify(expense.getPayerId(), expense, Activity.ActivityType.EXPENSE_DELETED, "deleted");
        });
    }

    private void normalizeExpense(Expense expense) {
        if (expense.getCurrency() == null) {
            expense.setCurrency("INR");
        }
        if (expense.getParticipantIds() == null || expense.getParticipantIds().isEmpty()) {
            expense.setParticipantIds(Set.of(expense.getPayerId()));
        }
    }

    private void recordAndNotify(String payerId, Expense expense, Activity.ActivityType type, String verb) {
        if (payerId == null) {
            return;
        }

        Activity activity = new Activity();
        activity.setUserId(payerId);
        activity.setType(type);
        activity.setRelatedExpenseId(expense.getId());
        activity.setDescription("Expense \"" + expense.getDescription() + "\" of " + expense.getAmount() + " " + expense.getCurrency() + " " + verb + ".");
        activityRepository.save(activity);

        userRepository.findById(payerId).ifPresent(user -> {
            try {
                notificationService.notifyActivity(user, activity.getDescription());
            } catch (Exception e) {
                // ignore for now
            }
        });
    }

    private void recordOwedActivities(Expense expense) {
        if (expense.getParticipantIds() == null) return;
        String payerName = userRepository.findById(expense.getPayerId())
                .map(u -> u.getName()).orElse("Someone");
        for (String pid : expense.getParticipantIds()) {
            if (pid.equals(expense.getPayerId())) continue;
            BigDecimal owed = BigDecimal.ZERO;
            if (expense.getCustomSplits() != null && expense.getCustomSplits().containsKey(pid)) {
                owed = expense.getCustomSplits().get(pid);
            } else {
                owed = expense.getAmount().divide(
                    BigDecimal.valueOf(expense.getParticipantIds().size()), 2, java.math.RoundingMode.HALF_UP);
            }
            Activity a = new Activity();
            a.setUserId(pid);
            a.setType(Activity.ActivityType.EXPENSE_OWED);
            a.setRelatedExpenseId(expense.getId());
            a.setDescription("You owe \u20b9" + owed + " to " + payerName + " for \"" + expense.getDescription() + "\".");
            activityRepository.save(a);
        }
    }

    public void settleExpense(String expenseId, String settlingUserId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));

        // If the payer clicks settle, settle all participants at once
        if (settlingUserId.equals(expense.getPayerId())) {
            settleAll(expenseId);
            return;
        }

        String payerName = userRepository.findById(expense.getPayerId())
                .map(u -> u.getName()).orElse("Someone");
        String settlerName = userRepository.findById(settlingUserId)
                .map(u -> u.getName()).orElse("Someone");
        BigDecimal owed = getOwedAmount(expense, settlingUserId);
        // Skip if already settled for this user+expense
        if (activityRepository.existsByRelatedExpenseIdAndUserIdAndType(expenseId, settlingUserId, Activity.ActivityType.EXPENSE_SETTLED)) {
            return;
        }
        // Activity for settler: "You paid ₹X to [payer]"
        Activity settlerActivity = new Activity();
        settlerActivity.setUserId(settlingUserId);
        settlerActivity.setType(Activity.ActivityType.EXPENSE_SETTLED);
        settlerActivity.setRelatedExpenseId(expenseId);
        settlerActivity.setDescription("You paid \u20b9" + owed + " to " + payerName + " for \"" + expense.getDescription() + "\".");
        activityRepository.save(settlerActivity);
        // Activity for payer: "Received ₹X from [settler]"
        Activity payerActivity = new Activity();
        payerActivity.setUserId(expense.getPayerId());
        payerActivity.setType(Activity.ActivityType.EXPENSE_SETTLED);
        payerActivity.setRelatedExpenseId(expenseId);
        payerActivity.setDescription("Received \u20b9" + owed + " from " + settlerName + " for \"" + expense.getDescription() + "\".");
        activityRepository.save(payerActivity);
    }

    public void settleAll(String expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found"));
        String payerName = userRepository.findById(expense.getPayerId())
                .map(u -> u.getName()).orElse("Someone");
        for (String pid : expense.getParticipantIds()) {
            if (pid.equals(expense.getPayerId())) continue;
            if (activityRepository.existsByRelatedExpenseIdAndUserIdAndType(expenseId, pid, Activity.ActivityType.EXPENSE_SETTLED)) {
                continue;
            }
            String settlerName = userRepository.findById(pid)
                    .map(u -> u.getName()).orElse("Someone");
            BigDecimal owed = getOwedAmount(expense, pid);
            Activity settlerActivity = new Activity();
            settlerActivity.setUserId(pid);
            settlerActivity.setType(Activity.ActivityType.EXPENSE_SETTLED);
            settlerActivity.setRelatedExpenseId(expenseId);
            settlerActivity.setDescription("You paid \u20b9" + owed + " to " + payerName + " for \"" + expense.getDescription() + "\".");
            activityRepository.save(settlerActivity);
            Activity payerActivity = new Activity();
            payerActivity.setUserId(expense.getPayerId());
            payerActivity.setType(Activity.ActivityType.EXPENSE_SETTLED);
            payerActivity.setRelatedExpenseId(expenseId);
            payerActivity.setDescription("Received \u20b9" + owed + " from " + settlerName + " for \"" + expense.getDescription() + "\".");
            activityRepository.save(payerActivity);
        }
    }

    private BigDecimal getOwedAmount(Expense expense, String userId) {
        if (expense.getCustomSplits() != null && expense.getCustomSplits().containsKey(userId)) {
            return expense.getCustomSplits().get(userId);
        }
        return expense.getAmount().divide(
            BigDecimal.valueOf(expense.getParticipantIds().size()), 2, java.math.RoundingMode.HALF_UP);
    }

    public List<Expense> listGroupExpenses(String groupId) {
        return expenseRepository.findByGroupId(groupId);
    }

    public List<Expense> listPersonalExpenses(String userId) {
        return expenseRepository.findByPayerIdAndType(userId, Expense.ExpenseType.PERSONAL);
    }

    public Optional<Expense> getExpenseById(String id) {
        return expenseRepository.findById(id);
    }

    public Map<String, BigDecimal> calculateSplits(Expense expense) {
        Map<String, BigDecimal> splits = new HashMap<>();
        Set<String> participants = expense.getParticipantIds();

        if (participants == null || participants.isEmpty()) {
            splits.put(expense.getPayerId(), expense.getAmount());
            return splits;
        }

        if (expense.getCustomSplits() != null && !expense.getCustomSplits().isEmpty()) {
            for (String pid : participants) {
                BigDecimal share = expense.getCustomSplits().getOrDefault(pid, BigDecimal.ZERO);
                splits.put(pid, share);
            }
            return splits;
        }

        BigDecimal equalShare = expense.getAmount()
                .divide(BigDecimal.valueOf(participants.size()), 2, java.math.RoundingMode.HALF_UP);
        for (String pid : participants) {
            splits.put(pid, equalShare);
        }
        return splits;
    }
}