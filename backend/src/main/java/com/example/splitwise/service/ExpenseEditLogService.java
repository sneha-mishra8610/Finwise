package com.example.splitwise.service;

import com.example.splitwise.model.ExpenseEditLog;
import com.example.splitwise.repository.ExpenseEditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Map;

@Service
public class ExpenseEditLogService{

    @Autowired
    private ExpenseEditLogRepository expenseEditLogRepository;

    public void logEdit(String expenseId,String editedBy,Map<String, Object> oldValues, Map<String,Object> newValues,String reason){
        ExpenseEditLog log=new ExpenseEditLog();
        log.setExpenseId(expenseId);
        log.setEditedBy(editedBy);
        log.setEditTime(new Date());
        log.setOldValues(oldValues);
        log.setNewValues(newValues);
        log.setReason(reason);
        expenseEditLogRepository.save(log);
    }

    public List<ExpenseEditLog> getEditLogsForExpense(String expenseId){
        return expenseEditLogRepository.findByExpenseIdOrderByEditTimeDesc(expenseId);
    }
}