package com.example.splitwise.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;

@Document(collection = "chatMessages")
public class ChatMessage {
    @Id
    private String id;
    private String groupId;
    private String senderId;
    private String message;
    private Instant timestamp;
    private String expenseId;

    public ChatMessage() {}

    public ChatMessage(String groupId, String senderId, String message, Instant timestamp,String expenseId) {
        this.groupId=groupId;
        this.senderId=senderId;
        this.message=message;
        this.timestamp=timestamp;
        this.expenseId=expenseId;
    }

    public void setId(String id) { this.id=id; }

    public String getGroupId() { return groupId; }
    public void setGroupId(String groupId) { this.groupId = groupId; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public Instant getTimestamp() { return timestamp; }
    public void setTimestamp(Instant timestamp) { this.timestamp = timestamp; }

    public String getExpenseId(){
        return expenseId;
    }
    public void setExpenseId(String expenseId){
        this.expenseId=expenseId;
    }
}
