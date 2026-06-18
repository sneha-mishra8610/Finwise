package com.example.splitwise.controller;

import com.example.splitwise.model.Activity;
import com.example.splitwise.repository.ActivityRepository;
import com.example.splitwise.service.ActivityService;
import com.example.splitwise.service.ExpenseService;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    private final ActivityRepository activityRepository;
    private final ExpenseService expenseService;
    private final ActivityService activityService;

    public ActivityController(ActivityRepository activityRepository, ExpenseService expenseService, ActivityService activityService) {
        this.activityRepository = activityRepository;
        this.expenseService = expenseService;
        this.activityService = activityService;
    }

    @GetMapping("/{userId}")
    public List<Activity> getUserActivity(
            @PathVariable("userId") String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        expenseService.generateDueRecurringExpenses();
        Pageable pageable = PageRequest.of(page, size);
        List<Activity> all = activityRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        Set<String> seen = new HashSet<>();
        List<Activity> deduped = new ArrayList<>();
        List<String> toDelete = new ArrayList<>();
        for (Activity a : all) {
            if (a.getType() == Activity.ActivityType.EXPENSE_SETTLED) {
                String key = a.getRelatedExpenseId() + "|" + a.getUserId() + "|" + a.getDescription();
                if (!seen.add(key)) {
                    toDelete.add(a.getId());
                    continue;
                }
            }
            deduped.add(a);
        }
        if (!toDelete.isEmpty()) {
            activityRepository.deleteAllById(toDelete);
        }
        return deduped;
    }

    @GetMapping("/{userId}/unread")
    public List<Activity> getUnreadActivities(@PathVariable("userId") String userId) {
        return activityService.getUnreadActivities(userId);
    }

    @PostMapping("/{userId}/mark-read")
    public void markActivitiesRead(@PathVariable("userId") String userId, @RequestBody List<String> ids) {
        activityService.markActivitiesRead(userId, ids);
    }

    @GetMapping("/{userId}/unread/count")
    public long getUnreadCount(@PathVariable("userId") String userId) {
        return activityService.countUnreadActivities(userId);
    }
}

