package com.example.splitwise.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.splitwise.model.ChatMessage;

import java.util.List;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {
    List<ChatMessage> findByGroupIdOrderByTimestampAsc(String groupId);

    List<ChatMessage> findByExpenseIdOrderByTimestampAsc(String expenseId);
}
