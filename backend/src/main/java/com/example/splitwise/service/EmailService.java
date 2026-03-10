package com.example.splitwise.service;

import com.example.splitwise.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    public void sendSignupEmail(User user) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }
        // Development stub: just log instead of sending real email.
        log.info("Signup email would be sent to {}", user.getEmail());
    }
}

