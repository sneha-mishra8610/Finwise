package com.example.splitwise.repository;

import com.example.splitwise.model.Expense;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ExpenseRepository extends MongoRepository<Expense, String> {

    List<Expense> findByGroupId(String groupId);

    List<Expense> findByPayerId(String payerId);

    List<Expense> findByPayerIdAndType(String payerId, com.example.splitwise.model.Expense.ExpenseType type);
}

