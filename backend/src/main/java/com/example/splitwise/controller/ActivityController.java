package com.example.splitwise.controller;

import com.example.splitwise.model.Activity;
import com.example.splitwise.repository.ActivityRepository;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/activities")
public class ActivityController {

    private final ActivityRepository activityRepository;

    public ActivityController(ActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    @GetMapping("/{userId}")
    public List<Activity> getUserActivity(@PathVariable("userId") String userId) {
        List<Activity> all = activityRepository.findByUserIdOrderByCreatedAtDesc(userId);
        // Deduplicate settle activities (keep only the first per expense+type+user)
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
}

