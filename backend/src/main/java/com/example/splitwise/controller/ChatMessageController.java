package com.example.splitwise.controller;

import com.example.splitwise.model.ChatMessage;
import com.example.splitwise.service.ChatMessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatMessageController {
    private final ChatMessageService chatMessageService;

    @Autowired
    public ChatMessageController(ChatMessageService chatMessageService) {
        this.chatMessageService=chatMessageService;
    }

    @PostMapping("/{groupId}")
    public ResponseEntity<ChatMessage> sendMessage(
            @PathVariable String groupId,
            @RequestBody Map<String,String> payload) {
        String senderId=payload.get("senderId"); 
        String message=payload.get("message");   
        if (senderId==null || message==null) {
            return ResponseEntity.badRequest().build();
        }
        ChatMessage saved = chatMessageService.saveMessage(groupId, senderId, message);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<List<ChatMessage>> getMessages(@PathVariable String groupId) {
        List<ChatMessage> messages=chatMessageService.getMessagesByGroupId(groupId);
        return ResponseEntity.ok(messages);
    }

    @GetMapping("{groupId}/expense/{expenseId}")
    public ResponseEntity<List<ChatMessage>> getExpenseMessages(@PathVariable String groupId, @PathVariable String expenseId){
        List<ChatMessage> messages=chatMessageService.getMessageByExpenseId(expenseId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping("{groupId}/expense/{expenseId}")
    public ResponseEntity<ChatMessage> sendExpenseMessage(
        @PathVariable String groupId,
        @PathVariable String expenseId,
        @RequestBody Map<String,String> payload){
            String senderId=payload.get("senderId");
            String message=payload.get("message");
            if(senderId==null||message==null)
                return ResponseEntity.badRequest().build();
            ChatMessage saved=chatMessageService.saveExpenseMessage(groupId, expenseId, senderId, message);
            return ResponseEntity.ok(saved);

    }
}