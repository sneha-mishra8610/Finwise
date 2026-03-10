package com.example.splitwise.service;

import com.example.splitwise.model.User;
// Firebase import removed
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    public void notifyActivity(User user, String message) {
        if (user == null || !user.isEmailNotificationsEnabled()) {
            return;
        }

        log.info("Notifying {}: {}", user.getEmail(), message);
    }
}

