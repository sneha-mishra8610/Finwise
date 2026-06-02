package com.example.splitwise.controller;

import com.example.splitwise.model.Expense;
import com.example.splitwise.model.Group;
import com.example.splitwise.model.User;
import com.example.splitwise.repository.ExpenseRepository;
import com.example.splitwise.repository.GroupRepository;
import com.example.splitwise.repository.UserRepository;
import com.example.splitwise.service.ExportService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/export")
@CrossOrigin(origins = "*")
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

    private List<Expense> getExpensesForUser(String userId) {
        Map<String, Expense> all = new LinkedHashMap<>();

        addExpenses(all, expenseRepository.findByPayerId(userId));
        addExpenses(all, expenseRepository.findByParticipantIdsContaining(userId));

        List<Group> groups = groupRepository.findByMemberIdsContaining(userId);
        for (Group g : groups) {
            addExpenses(all, expenseRepository.findByGroupId(g.getId()));
        }

        return new ArrayList<>(all.values());
    }

    private void addExpenses(Map<String, Expense> target, List<Expense> expenses) {
        for (Expense expense : expenses) {
            String key = expense.getId() != null ? expense.getId() : String.valueOf(System.identityHashCode(expense));
            target.putIfAbsent(key, expense);
        }
    }


    @GetMapping("/pdf/{userId}")
    public ResponseEntity<byte[]> exportPdf(@PathVariable String userId) throws Exception {
        User user = userRepository.findById(userId).orElseThrow();
        List<Expense> expenses = getExpensesForUser(userId);
        Map<String, String> userIdToName = getUserIdToName();
        Map<String, String> groupIdToName = getGroupIdToName();

        byte[] pdf = exportService.generatePdf(user, expenses, userIdToName, groupIdToName);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=expenses_" + userId + ".pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(pdf);
    }


    @GetMapping("/excel/{userId}")
    public ResponseEntity<byte[]> exportExcel(@PathVariable String userId) throws Exception {
        User user = userRepository.findById(userId).orElseThrow();
        List<Expense> expenses = getExpensesForUser(userId);
        Map<String, String> userIdToName = getUserIdToName();
        Map<String, String> groupIdToName = getGroupIdToName();

        byte[] excel = exportService.generateExcel(user, expenses, userIdToName, groupIdToName);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=expenses_" + userId + ".xlsx")
            .contentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(excel);
    }


    @GetMapping("/word/{userId}")
    public ResponseEntity<byte[]> exportWord(@PathVariable String userId) throws Exception {
        User user = userRepository.findById(userId).orElseThrow();
        List<Expense> expenses = getExpensesForUser(userId);
        Map<String, String> userIdToName = getUserIdToName();
        Map<String, String> groupIdToName = getGroupIdToName();

        byte[] word = exportService.generateWord(user, expenses, userIdToName, groupIdToName);

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=expenses_" + userId + ".docx")
            .contentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
            .body(word);
    }

    private Map<String, String> getUserIdToName() {
        return userRepository.findAll().stream()
            .filter(user -> user.getId() != null)
            .collect(Collectors.toMap(User::getId, user -> Objects.toString(user.getName(), user.getId()), (left, right) -> left));
    }

    private Map<String, String> getGroupIdToName() {
        return groupRepository.findAll().stream()
            .filter(group -> group.getId() != null)
            .collect(Collectors.toMap(Group::getId, group -> Objects.toString(group.getName(), group.getId()), (left, right) -> left));
    }
}
