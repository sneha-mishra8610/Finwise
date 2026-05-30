package com.example.splitwise.controller;

import java.util.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.splitwise.model.Notification;
import com.example.splitwise.service.NotificationService;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private static final Logger logger = LoggerFactory.getLogger(NotificationController.class);

    public NotificationController(NotificationService notificationService){
        this.notificationService=notificationService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<Notification>> getNotifications(
            @PathVariable("userId") String userId,
            @RequestParam(value = "preferredCurrency", required = false, defaultValue = "INR") String preferredCurrency){
        try {
            return ResponseEntity.ok(notificationService.getScheduledNotifications(userId, preferredCurrency));
        } catch (Exception e) {
            logger.error("Failed to fetch notifications for userId={}", userId, e);
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    @GetMapping("/{userId}/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(
            @PathVariable("userId") String userId,
            @RequestParam(value = "preferredCurrency", required = false, defaultValue = "INR") String preferredCurrency) {
        try {
            return ResponseEntity.ok(notificationService.getUnreadNotifications(userId, preferredCurrency));
        } catch (Exception e) {
            logger.error("Failed to fetch unread notifications for userId={}", userId, e);
            return ResponseEntity.status(500).body(Collections.emptyList());
        }
    }

    @GetMapping("/{userId}/read")
    public ResponseEntity<Map<String, Object>> getReadNotifications(
            @PathVariable("userId") String userId,
            @RequestParam(value = "page", required = false, defaultValue = "0") int page,
            @RequestParam(value = "size", required = false, defaultValue = "10") int size) {
        try {
            List<Notification> items = notificationService.getReadNotifications(userId, page, size);
            long totalRead = notificationService.countReadNotifications(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("items", items);
            response.put("page", page);
            response.put("size", size);
            response.put("totalRead", totalRead);
            response.put("hasMore", ((long) (page + 1) * size) < totalRead);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to fetch read notifications for userId={}", userId, e);
            return ResponseEntity.status(500).body(Collections.emptyMap());
        }
    }

    @PostMapping("/{userId}/mark-read")
    public ResponseEntity<Void> markRead(
            @PathVariable("userId") String userId,
            @RequestBody List<String> notificationIds) {
        try {
            notificationService.markNotificationsRead(userId, notificationIds);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            logger.error("Failed to mark notifications read for userId={}", userId, e);
            return ResponseEntity.status(500).build();
        }
    }
}
