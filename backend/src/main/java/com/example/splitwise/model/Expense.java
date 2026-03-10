package com.example.splitwise.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Document(collection = "expenses")
public class Expense {

    public enum ExpenseType {
        PERSONAL,
        GROUP
    }

    @Id
    private String id;

    private String description;
    private BigDecimal amount;

    // INR by default
    private String currency = "INR";

    // Who paid
    private String payerId;

    // Who is included in the split (userIds). For PERSONAL this will usually be just the owner.
    private Set<String> participantIds = new HashSet<>();
    @JsonProperty("customSplits")
    @Field("customSplits")
    private Map<String,BigDecimal> customSplits;

    // Optional group reference for group expenses
    private String groupId;

    private ExpenseType type;

    private Instant createdAt = Instant.now();

    // Who created the expense (may differ from payerId)
    private String createdBy;

    // Optional URL to an image stored in Firebase Storage
    private String imageUrl;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getPayerId() {
        return payerId;
    }

    public void setPayerId(String payerId) {
        this.payerId = payerId;
    }

    public Set<String> getParticipantIds() {
        return participantIds;
    }

    public void setParticipantIds(Set<String> participantIds) {
        this.participantIds = participantIds;
    }

    public String getGroupId() {
        return groupId;
    }

    public void setGroupId(String groupId) {
        this.groupId = groupId;
    }

    public ExpenseType getType() {
        return type;
    }

    public void setType(ExpenseType type) {
        this.type = type;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Map<String,BigDecimal> getCustomSplits(){
        return customSplits;
    }

    public void setCustomSplits(Map<String,BigDecimal> customSplits){
        this.customSplits=customSplits;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Expense expense = (Expense) o;
        return Objects.equals(id, expense.id) &&
                Objects.equals(description, expense.description) &&
                Objects.equals(amount, expense.amount) &&
                Objects.equals(currency, expense.currency) &&
                Objects.equals(payerId, expense.payerId) &&
                Objects.equals(participantIds, expense.participantIds) &&
                Objects.equals(groupId, expense.groupId) &&
                type == expense.type &&
                Objects.equals(createdAt, expense.createdAt) &&
                Objects.equals(createdBy, expense.createdBy) &&
                Objects.equals(imageUrl, expense.imageUrl);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, description, amount, currency, payerId, participantIds, groupId, type, createdAt, createdBy, imageUrl);
    }

    @Override
    public String toString() {
        return "Expense{" +
                "id='" + id + '\'' +
                ", description='" + description + '\'' +
                ", amount=" + amount +
                ", currency='" + currency + '\'' +
                ", payerId='" + payerId + '\'' +
                ", participantIds=" + participantIds +
                ", groupId='" + groupId + '\'' +
                ", type=" + type +
                ", createdAt=" + createdAt +
                ", createdBy='" + createdBy + '\'' +
                ", imageUrl='" + imageUrl + '\'' +
                '}';
    }
}

