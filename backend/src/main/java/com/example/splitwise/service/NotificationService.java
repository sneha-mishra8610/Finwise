package com.example.splitwise.service;

import com.example.splitwise.model.User;
import com.google.firebase.auth.FirebaseAuthException;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    // Placeholder for future Firebase-based notifications or email integrations.
    // For now this just exposes a hook that can be extended.

    public void notifyActivity(User user, String message) throws FirebaseAuthException {
        if (user == null || !user.isEmailNotificationsEnabled()) {
            return;
        }

        // In a real implementation, you might:
        // - Send an email via a third-party service
        // - Use Firebase Cloud Messaging to send push notifications
        // Here we just log or no-op to keep the example simple.
        System.out.println("Notifying " + user.getEmail() + ": " + message);
    }
}

