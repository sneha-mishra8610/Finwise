package com.example.splitwise.service;

import com.example.splitwise.model.BudgetSummary;
import com.example.splitwise.model.Expense;
import com.example.splitwise.model.Group;
import com.example.splitwise.model.User;
import com.example.splitwise.repository.ExpenseRepository;
import com.example.splitwise.repository.GroupRepository;
import com.example.splitwise.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class FinancialAnalyticsService {

    public record FinancialSnapshot(
            String period,
            String budgetPeriod,
            FinancialPeriodService.DateRange currentRange,
            FinancialPeriodService.DateRange previousRange,
            BigDecimal totalSpent,
            BigDecimal previousPeriodSpent,
            BigDecimal budget,
            BigDecimal budgetUsedPercent,
            long expenseCount,
            String topCategory,
            Map<String, BigDecimal> categorySpending
    ) {}

    private final ExpenseRepository expenseRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final BudgetService budgetService;
    private final FinancialPeriodService financialPeriodService;

    public FinancialAnalyticsService(ExpenseRepository expenseRepository,
                                     GroupRepository groupRepository,
                                     UserRepository userRepository,
                                     BudgetService budgetService,
                                     FinancialPeriodService financialPeriodService) {
        this.expenseRepository = expenseRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.budgetService = budgetService;
        this.financialPeriodService = financialPeriodService;
    }

    public FinancialSnapshot buildSnapshot(String userId, String period) {
        User user = userRepository.findById(userId).orElseThrow();
        FinancialPeriodService.DateRange currentRange = financialPeriodService.resolvePeriod(period);
        FinancialPeriodService.DateRange previousRange = financialPeriodService.previousPeriod(period);

        List<Expense> currentExpenses = getExpensesForUser(userId, currentRange);
        List<Expense> previousExpenses = previousRange == null ? List.of() : getExpensesForUser(userId, previousRange);

        BigDecimal totalSpent = sumExpenses(currentExpenses);
        BigDecimal previousPeriodSpent = sumExpenses(previousExpenses);
        Map<String, BigDecimal> categorySpending = buildCategorySpending(currentExpenses);
        String topCategory = categorySpending.keySet().stream().findFirst().orElse(null);
        BigDecimal budget = resolveCurrentBudget(user.getId(), period);
        BigDecimal budgetUsedPercent = budget != null && budget.compareTo(BigDecimal.ZERO) > 0
                ? totalSpent.multiply(BigDecimal.valueOf(100)).divide(budget, 2, RoundingMode.HALF_UP)
                : null;

        return new FinancialSnapshot(
                period,
                financialPeriodService.toBudgetPeriod(period),
                currentRange,
                previousRange,
                totalSpent,
                previousPeriodSpent,
                budget,
                budgetUsedPercent,
                currentExpenses.size(),
                topCategory,
                categorySpending
        );
    }

    public List<Expense> getExpensesForUser(String userId, FinancialPeriodService.DateRange range) {
        Map<String, Expense> all = new LinkedHashMap<>();

        addExpenses(all, expenseRepository.findByPayerId(userId));
        addExpenses(all, expenseRepository.findByParticipantIdsContaining(userId));

        List<Group> groups = groupRepository.findByMemberIdsContaining(userId);
        for (Group group : groups) {
            addExpenses(all, expenseRepository.findByGroupId(group.getId()));
        }

        return all.values().stream()
                .filter(expense -> expense.getCreatedAt() != null
                        && !expense.getCreatedAt().isBefore(range.from())
                        && expense.getCreatedAt().isBefore(range.to()))
                .sorted(Comparator.comparing(Expense::getCreatedAt))
                .collect(Collectors.toList());
    }

    public Map<String, BigDecimal> buildCategorySpending(List<Expense> expenses) {
        Map<String, BigDecimal> byCategory = new LinkedHashMap<>();
        for (Expense expense : expenses) {
            String category = (expense.getTag() != null && !expense.getTag().isBlank() && !"-".equals(expense.getTag()))
                    ? capitalise(expense.getTag())
                    : "Uncategorised";
            byCategory.merge(category, amount(expense), BigDecimal::add);
        }

        return byCategory.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (left, right) -> left,
                        LinkedHashMap::new
                ));
    }

    public BigDecimal sumExpenses(List<Expense> expenses) {
        return expenses.stream()
                .map(this::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal resolveCurrentBudget(String userId, String period) {
        String budgetPeriod = financialPeriodService.toBudgetPeriod(period);
        if (budgetPeriod == null) {
            return null;
        }

        return budgetService.getUserBudgets(userId).stream()
                .filter(summary -> budgetPeriod.equals(summary.getPeriod()))
                .map(BudgetSummary::getAmount)
                .findFirst()
                .map(BigDecimal::valueOf)
                .orElse(null);
    }

    private void addExpenses(Map<String, Expense> target, List<Expense> expenses) {
        for (Expense expense : expenses) {
            String key = expense.getId() != null
                    ? expense.getId()
                    : String.valueOf(System.identityHashCode(expense));
            target.putIfAbsent(key, expense);
        }
    }

    private BigDecimal amount(Expense expense) {
        return expense.getAmount() != null ? expense.getAmount() : BigDecimal.ZERO;
    }

    private String capitalise(String value) {
        if (value == null || value.isBlank()) return "Uncategorised";
        String cleaned = value.trim().toLowerCase();
        return Character.toUpperCase(cleaned.charAt(0)) + cleaned.substring(1);
    }
}