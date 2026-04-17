package com.example.splitwise.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.Map;

@Document(collection="expense_edit_logs")
public class ExpenseEditLog {
    @Id
    private String id;

    public String getId(){
        return id;
    }

    void setId(String id){
        this.id=id;
    }

    private String expenseId;

    public String getExpenseId(){
        return expenseId;
    }

    public void setExpenseId(String expenseId){
        this.expenseId=expenseId;
    }

    private String editedBy; 

    public String getEditedBy(){
        return editedBy;
    }

    public void setEditedBy(String editedBy){
        this.editedBy=editedBy;
    }

    private Date editTime;

    public Date getEditTime(){
        return editTime;
    }

    public void setEditTime(Date editTime){
        this.editTime=editTime;
    }

    private Map<String, Object> oldValues;

    public Map<String,Object> getOldValues(){
        return oldValues;
    }

    public void setOldValues(Map<String,Object> oldValues){
        this.oldValues=oldValues;
    }

    private Map<String, Object> newValues;

    public Map<String,Object> getNewValues(){
        return newValues;
    }

    public void setNewValues(Map<String,Object> newValues){
        this.newValues=newValues;
    }

    private String reason;

    public String getReason(){
        return reason;
    }

    public void setReason(String reason){
        this.reason=reason;
    }

}