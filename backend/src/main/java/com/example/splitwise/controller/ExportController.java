package com.example.splitwise.controller;

import com.example.splitwise.model.Expense;
import com.example.splitwise.model.Group;
import com.example.splitwise.model.User;
import com.example.splitwise.repository.ExpenseRepository;
import com.example.splitwise.repository.GroupRepository;
import com.example.splitwise.repository.UserRepository;
import com.example.splitwise.service.ExportService;
import com.example.splitwise.service.ExportService.DateRange;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.IsoFields;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    private final ExportService exportService;
    private final ExpenseRepository expenseRepository;
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    public ExportController(ExportService exportService,
                            ExpenseRepository expenseRepository,
                            GroupRepository groupRepository,
                            UserRepository userRepository) {
        this.exportService = exportService;
        this.expenseRepository = expenseRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
    }
    
    static DateRange resolvePeriod(String period) {
        if (period == null || period.isBlank() || period.equalsIgnoreCase("all")) {
            return new DateRange(Instant.EPOCH, Instant.now());
        }

        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);

        LocalDate start = switch (period.toLowerCase()) {
            case "today"        -> today;
            case "this_week"    -> today.with(java.time.DayOfWeek.MONDAY);
            case "this_month"   -> today.withDayOfMonth(1);
            case "this_quarter" -> {
                int q = today.get(IsoFields.QUARTER_OF_YEAR);
                yield LocalDate.of(today.getYear(), (q - 1) * 3 + 1, 1);
            }
            case "this_year"    -> LocalDate.of(today.getYear(), 1, 1);
            default             -> LocalDate.EPOCH;
        };

        Instant from = start.atStartOfDay(zone).toInstant();
        Instant to   = today.plusDays(1).atStartOfDay(zone).toInstant(); // exclusive upper bound (end of today)
        return new DateRange(from, to);
    }

    @GetMapping("/pdf/{userId}")
    public ResponseEntity<byte[]> exportPdf(
            @PathVariable String userId,
            @RequestParam(defaultValue = "all") String period) throws Exception {

        User user             = userRepository.findById(userId).orElseThrow();
        DateRange range       = resolvePeriod(period);
        List<Expense> expenses = getExpensesForUser(userId, range);
        Map<String, String> userIdToName  = getUserIdToName();
        Map<String, String> groupIdToName = getGroupIdToName();

        byte[] pdf = exportService.generatePdf(user, expenses, userIdToName, groupIdToName, range);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=finwise_" + userId + "_" + period + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    @GetMapping("/excel/{userId}")
    public ResponseEntity<byte[]> exportExcel(
            @PathVariable String userId,
            @RequestParam(defaultValue = "all") String period) throws Exception {

        User user             = userRepository.findById(userId).orElseThrow();
        DateRange range       = resolvePeriod(period);
        List<Expense> expenses = getExpensesForUser(userId, range);
        Map<String, String> userIdToName  = getUserIdToName();
        Map<String, String> groupIdToName = getGroupIdToName();

        byte[] excel = exportService.generateExcel(user, expenses, userIdToName, groupIdToName, range);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=finwise_" + userId + "_" + period + ".xlsx")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excel);
    }

    @GetMapping("/word/{userId}")
    public ResponseEntity<byte[]> exportWord(
            @PathVariable String userId,
            @RequestParam(defaultValue = "all") String period) throws Exception {

        User user             = userRepository.findById(userId).orElseThrow();
        DateRange range       = resolvePeriod(period);
        List<Expense> expenses = getExpensesForUser(userId, range);
        Map<String, String> userIdToName  = getUserIdToName();
        Map<String, String> groupIdToName = getGroupIdToName();

        byte[] word = exportService.generateWord(user, expenses, userIdToName, groupIdToName, range);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=finwise_" + userId + "_" + period + ".docx")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .body(word);
    }

    private List<Expense> getExpensesForUser(String userId, DateRange range) {
        Map<String, Expense> all = new LinkedHashMap<>();

        addExpenses(all, expenseRepository.findByPayerId(userId));
        addExpenses(all, expenseRepository.findByParticipantIdsContaining(userId));

        List<Group> groups = groupRepository.findByMemberIdsContaining(userId);
        for (Group g : groups) {
            addExpenses(all, expenseRepository.findByGroupId(g.getId()));
        }

        return all.values().stream()
                .filter(e -> e.getCreatedAt() != null
                        && !e.getCreatedAt().isBefore(range.from())
                        && e.getCreatedAt().isBefore(range.to()))
                .sorted(java.util.Comparator.comparing(Expense::getCreatedAt))
                .collect(Collectors.toList());
    }

    private void addExpenses(Map<String, Expense> target, List<Expense> expenses) {
        for (Expense expense : expenses) {
            String key = expense.getId() != null
                    ? expense.getId()
                    : String.valueOf(System.identityHashCode(expense));
            target.putIfAbsent(key, expense);
        }
    }

    private Map<String, String> getUserIdToName() {
        return userRepository.findAll().stream()
                .filter(u -> u.getId() != null)
                .collect(Collectors.toMap(
                        User::getId,
                        u -> Objects.toString(u.getName(), u.getId()),
                        (l, r) -> l));
    }

    private Map<String, String> getGroupIdToName() {
        return groupRepository.findAll().stream()
                .filter(g -> g.getId() != null)
                .collect(Collectors.toMap(
                        Group::getId,
                        g -> Objects.toString(g.getName(), g.getId()),
                        (l, r) -> l));
    }
}