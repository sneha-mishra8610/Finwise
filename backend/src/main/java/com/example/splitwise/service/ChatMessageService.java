package com.example.splitwise.service;

import com.example.splitwise.model.ChatMessage;
import com.example.splitwise.repository.ChatMessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class ChatMessageService {
    private final ChatMessageRepository chatMessageRepository;

    @Autowired
    public ChatMessageService(ChatMessageRepository chatMessageRepository) {
        this.chatMessageRepository=chatMessageRepository;
    }

    public ChatMessage saveMessage(String groupId,String senderId,String message) {
        ChatMessage chatMessage = new ChatMessage();
        chatMessage.setGroupId(groupId);
        chatMessage.setSenderId(senderId);
        chatMessage.setMessage(message);
        chatMessage.setTimestamp(Instant.now());
        chatMessage.setExpenseId(null);
        return chatMessageRepository.save(chatMessage);
    }

    public List<ChatMessage> getMessagesByGroupId(String groupId) {
        return chatMessageRepository.findByGroupIdOrderByTimestampAsc(groupId);
    }

    public ChatMessage saveExpenseMessage(String groupId,String expenseId,String senderId,String message){
        ChatMessage chatMessage=new ChatMessage();
        chatMessage.setExpenseId(expenseId);
        chatMessage.setSenderId(senderId);
        chatMessage.setMessage(message);
        chatMessage.setGroupId(groupId);
        chatMessage.setTimestamp(Instant.now());
        return chatMessageRepository.save(chatMessage);
    }

    public List<ChatMessage> getMessageByExpenseId(String expenseId){
        return chatMessageRepository.findByExpenseIdOrderByTimestampAsc(expenseId);
    }
}
