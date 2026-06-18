package com.example.splitwise.model;

import java.time.Instant;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;


@Document(collection="notifications")
public class Notification {
    public static enum Type{
        OWE,
        OWED,
        FRIEND_ADDED,
        GROUP_CREATED,
        EXPENSE_ADDED,
        EXPENSE_UPDATED,
        EXPENSE_DELETED,
        EXPENSE_SETTLED,
        EXPENSE_OWED,
        SETTLEMENT_REMINDER
    }

    @Id
    private String id;
    private String userId;
    private String expenseId;
    private Type type;
    private String message;
    private boolean read=false;
    private Instant lastSent;
    private Instant createdAt;

    /**
     * Links this notification back to the Activity row that generated it.
     * When a notification is marked read, the parent Activity.isRead is also
     * set to true so both collections stay in sync.
     */
    private String activityId;

    public Notification(String userId, String expenseId, Type type, String message, Instant now){
        this.userId=userId;
        this.expenseId=expenseId;
        this.type=type;
        this.message=message;
        this.lastSent=now;
        this.createdAt=now;
    }

    public String getActivityId() {
        return activityId;
    }

    public void setActivityId(String activityId) {
        this.activityId = activityId;
    }

    public Instant getLastSent() {
        return lastSent;
    }
    public void setLastSent(Instant lastSent) {
        this.lastSent = lastSent;
    }

    public String getId() {
        return id;
    }
    public void setId(String id) {
        this.id = id;
    }
    public String getUserId() {
        return userId;
    }
    public void setUserId(String userId) {
        this.userId = userId;
    }
    public String getExpenseId() {
        return expenseId;
    }
    public void setExpenseId(String expenseId) {
        this.expenseId = expenseId;
    }
    public Type getType() {
        return type;
    }
    public void setType(Type type) {
        this.type = type;
    }
    public String getMessage() {
        return message;
    }
    public void setMessage(String message) {
        this.message = message;
    }
    public boolean isRead() {
        return read;
    }
    public void setRead(boolean read) {
        this.read = read;
    }
    
    public Instant getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
