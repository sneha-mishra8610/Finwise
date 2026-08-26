package com.example.splitwise.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class ExpenseCategorizationService {

    private static final String GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
    private static final String DEFAULT_CATEGORY = "miscellaneous";
    private static final List<String> ALLOWED_CATEGORIES = List.of(
        "food","groceries",
        "rent",
        "transport",
        "travel",
        "insurance",
        "investments",
        "utilities",
        "subscriptions",
        "health",
        "education",
        "childcare",
        "pets",
        "taxes",
        "gifts",
        "charity",
        "maintenance",
        "loans",
        "fees",
        "entertainment",
        "shopping",
        "miscellaneous"
    );
    private static final Set<String> ALLOWED_CATEGORY_LOOKUP = Set.copyOf(ALLOWED_CATEGORIES);

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String groqApiKey;
    private final String groqModel;

    public ExpenseCategorizationService(ObjectMapper objectMapper,
                                        @Value("${groq.api-key:}") String groqApiKey,
                                        @Value("${groq.model:llama-3.1-8b-instant}") String groqModel) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
        this.groqApiKey = groqApiKey;
        this.groqModel = groqModel;
    }

    public String categorizeExpense(String expenseDescription) {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            return DEFAULT_CATEGORY;
        }

        String description = expenseDescription == null ? "" : expenseDescription.trim();
        if (description.isBlank()) {
            return DEFAULT_CATEGORY;
        }

        try {
            LinkedHashMap<String, Object> body = new LinkedHashMap<>();
            body.put("model", groqModel);
            body.put("temperature", 0);
            body.put("max_tokens", 100);
            body.put("messages", List.of(
                java.util.Map.of(
    "role",
    "system",
    "content",
    "Return only the single best category. Use exactly one category from the provided list. Do not explain."
),
                java.util.Map.of(
    "role",
    "user",
    "content",
    "Expense: " + description +
    ". Categories: " + String.join(",", ALLOWED_CATEGORIES)
)
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GROQ_ENDPOINT))
                .timeout(java.time.Duration.ofSeconds(5))
                    .header("Authorization", "Bearer " + groqApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body), StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                return DEFAULT_CATEGORY;
            }

            String content = objectMapper.readTree(response.body())
        .path("choices").path(0).path("message").path("content").asText("");

return sanitizeCategory(content);
        } catch (IOException ex) {
            return DEFAULT_CATEGORY;
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            return DEFAULT_CATEGORY;
        } catch (RuntimeException ex) {
            return DEFAULT_CATEGORY;
        }
    }

    private String sanitizeCategory(String rawResponse) {

    if (rawResponse == null || rawResponse.isBlank()) {
        return DEFAULT_CATEGORY;
    }

    String content = rawResponse.trim();

    if (content.startsWith("```") && content.endsWith("```")) {
        content = content
                .replaceFirst("^```(?:json)?\\s*", "")
                .replaceFirst("\\s*```$", "")
                .trim();
    }

    if (content.startsWith("\"") && content.endsWith("\"")) {
        content = content.substring(1, content.length() - 1).trim();
    }

    if (ALLOWED_CATEGORY_LOOKUP.contains(content)) {
        return content;
    }

    return DEFAULT_CATEGORY;
}
}