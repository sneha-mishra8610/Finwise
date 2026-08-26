package com.example.splitwise.controller;

import com.example.splitwise.service.AiInsightsService;
import com.example.splitwise.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiInsightsController {

    private final AiInsightsService aiInsightsService;
    private final JwtService jwtService;

    public AiInsightsController(AiInsightsService aiInsightsService, JwtService jwtService) {
        this.aiInsightsService = aiInsightsService;
        this.jwtService = jwtService;
    }

        @GetMapping("/insights")
public ResponseEntity<?> getInsights(
        @RequestParam(defaultValue = "all") String period,
        @RequestParam(defaultValue = "INR") String preferredCurrency,
        HttpServletRequest request) {

    String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);

    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Missing authorization token"));
    }

    try {
        String userId = jwtService.validateAndGetUserId(authHeader.substring(7));

        return ResponseEntity.ok(
                Map.of(
                        "insights",
                        aiInsightsService.generateInsights(
                                userId,
                                period,
                                preferredCurrency
                        )
                )
        );

    } catch (IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));

    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of(
                        "error", "Failed to generate insights",
                        "details", e.getMessage() != null
                                ? e.getMessage()
                                : e.getClass().getName()
                ));
    }
}
}