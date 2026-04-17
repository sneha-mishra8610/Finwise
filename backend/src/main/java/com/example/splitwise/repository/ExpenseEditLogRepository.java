package com.example.splitwise.repository;

import org.springframework.data.mongodb.repository.MongoRepository;
import com.example.splitwise.model.ExpenseEditLog;
import java.util.List;

public interface ExpenseEditLogRepository extends MongoRepository<ExpenseEditLog, String>{
    List<ExpenseEditLog> findByExpenseIdOrderByEditTimeDesc(String expenseId);
}
