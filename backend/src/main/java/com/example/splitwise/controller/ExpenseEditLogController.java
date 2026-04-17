package com.example.splitwise.controller;

import com.example.splitwise.model.ExpenseEditLog;
import com.example.splitwise.repository.ExpenseEditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ExpenseEditLogController {
    
    @Autowired
    private ExpenseEditLogRepository expenseEditLogRepository;

    @GetMapping("/expense-edit-logs/{expenseId}")
    public List<ExpenseEditLog> getEditLogsAlt(@PathVariable String expenseId){
    return expenseEditLogRepository.findByExpenseIdOrderByEditTimeDesc(expenseId);
    }
}
