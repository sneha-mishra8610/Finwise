package com.example.splitwise.service;

import com.example.splitwise.model.BudgetSummary;
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
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiInsightsService {

    private static final String GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

    private final FinancialAnalyticsService financialAnalyticsService;
    private final BudgetService budgetService;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private final String groqApiKey;
    private final String groqModel;

    public AiInsightsService(FinancialAnalyticsService financialAnalyticsService,
                             BudgetService budgetService,
                             ObjectMapper objectMapper,
                             @Value("${groq.api-key:}") String groqApiKey,
                             @Value("${groq.model:llama-3.1-8b-instant}") String groqModel) {
        this.financialAnalyticsService = financialAnalyticsService;
        this.budgetService = budgetService;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newHttpClient();
        this.groqApiKey = groqApiKey;
        this.groqModel = groqModel;
    }

    public List<String> generateInsights(String userId, String period, String preferredCurrency) throws IOException, InterruptedException {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            throw new IllegalStateException("Groq API key is not configured");
        }

        FinancialAnalyticsService.FinancialSnapshot snapshot = financialAnalyticsService.buildSnapshot(userId, period);
    Map<String, Object> summary = buildSummaryPayload(userId, snapshot, preferredCurrency);

    String systemPrompt =
        "You are FinWise, a personal financial analysis assistant. "
        + "Analyze the supplied financial summary and ALL budgets provided for the user. "
        + "Your job is to explain the user's actual spending patterns and provide practical actions they can take. "
        + "You are not a chatbot and should not ask questions.\n\n"

        + "For each insight:\n"
        + "1. Identify a meaningful financial observation.\n"
        + "2. Explain briefly why it matters.\n"
        + "3. Give one specific, realistic action the user can take.\n\n"

        + "Use ALL supplied budgets and compare them with the relevant spending data. "
        + "Consider the budget amount, budget period, category, and actual spending when available. "
        + "Clearly identify budgets that are exceeded, nearly exceeded, or comfortably within limits. "
        + "If spending exceeds a budget, explain the difference and suggest a practical way to reduce or control spending. "
        + "If spending is comfortably within budget, acknowledge the positive behavior and suggest how to maintain it. "
        + "Do not compare spending with a budget when their periods or categories are not compatible.\n\n"

        + "Focus on:\n"
        + "- overall spending trends\n"
        + "- spending compared with budgets\n"
        + "- category-level spending\n"
        + "- budget utilization\n"
        + "- overspending or unusually high spending\n"
        + "- categories approaching their budget limits\n"
        + "- changes from the previous period\n"
        + "- areas where the user is spending efficiently\n"
        + "- practical ways to reduce unnecessary spending\n"
        + "- realistic budgeting and spending-control tips\n\n"

        + "Use actual numbers from the supplied data when useful. "
        + "Do not invent, estimate, or assume numbers, budgets, categories, or trends that are not present in the supplied data. "
        + "If a budget has no corresponding spending data, do not claim that it has been exceeded or used. "
        + "If there is insufficient data for a meaningful comparison, skip that comparison.\n\n"

        + "Prioritize the most useful and significant findings rather than describing every number. "
        + "Avoid repetitive insights. "
        + "Include positive observations when the user's spending is healthy, not only warnings.\n\n"

        + "Recommendations must be practical and achievable. "
        + "Do not suggest extreme spending cuts. "
        + "Do not provide investment, tax, loan, or other financial advice beyond the supplied spending and budget data.\n\n"

        + "The authenticated user's preferred currency is supplied in the request and should be used when presenting monetary amounts in the insights.\n\n"

        + "Return exactly 3-5 concise, self-contained insights. "
        + "Each insight should contain the observation, why it matters, and an actionable recommendation when appropriate. "
        + "Return only a valid JSON array of strings. "
        + "Do not include markdown, code fences, headings, or any text outside the JSON array.";

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", groqModel);
        body.put("temperature", 0.2);
        body.put("max_tokens", 2000);
        body.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", "Financial summary:\n" + objectMapper.writeValueAsString(summary))
        ));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_ENDPOINT))
                .header("Authorization", "Bearer " + groqApiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body), StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() < 200 || response.statusCode() >= 300) {

    throw new IllegalStateException(
            "Groq API request failed with status " + response.statusCode()
                    + ": " + response.body()
    );
}

        JsonNode root = objectMapper.readTree(response.body());
        String content = root.path("choices").path(0).path("message").path("content").asText("");
        if (content == null || content.isBlank()) {
            throw new IllegalStateException("Groq API returned an empty response");
        }

        String cleaned = stripCodeFences(content.trim());
        JsonNode insightsNode = objectMapper.readTree(cleaned);
        if (!insightsNode.isArray()) {
            throw new IllegalStateException("Groq API returned invalid insights payload");
        }

        List<String> insights = new ArrayList<>();
        for (JsonNode node : insightsNode) {
            String insight = node.asText("").trim();
            if (!insight.isBlank()) {
                insights.add(insight);
            }
        }

        if (insights.size() < 3) {
            throw new IllegalStateException("Groq API returned fewer than 3 insights");
        }

        return insights.size() > 5 ? insights.subList(0, 5) : insights;
    }

    private Map<String, Object> buildSummaryPayload(String userId, FinancialAnalyticsService.FinancialSnapshot snapshot, String preferredCurrency) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("period", snapshot.period());
        payload.put("budgetPeriod", snapshot.budgetPeriod());
        payload.put("preferredCurrency", preferredCurrency);
        payload.put("totalSpent", snapshot.totalSpent());
        payload.put("budget", snapshot.budget());
        payload.put("previousPeriodSpent", snapshot.previousPeriodSpent());
        payload.put("budgetUsedPercent", snapshot.budgetUsedPercent());
        payload.put("expenseCount", snapshot.expenseCount());
        payload.put("topCategory", snapshot.topCategory());
        payload.put("categorySpending", snapshot.categorySpending());
        payload.put("budgets", buildBudgetPayload(userId));
        return payload;
    }

    private List<Map<String, Object>> buildBudgetPayload(String userId) {
        List<Map<String, Object>> budgets = new ArrayList<>();
        for (BudgetSummary summary : budgetService.getUserBudgets(userId)) {
            Map<String, Object> budget = new LinkedHashMap<>();
            budget.put("category", summary.getLabel() != null && !summary.getLabel().isBlank() ? summary.getLabel() : summary.getPeriod());
            budget.put("period", summary.getPeriod());
            budget.put("amount", summary.getAmount());
            budget.put("spent", summary.getSpent());
            budget.put("remaining", summary.getRemaining());
            budget.put("rangeStart", summary.getRangeStart());
            budget.put("rangeEnd", summary.getRangeEnd());
            budget.put("label", summary.getLabel());
            budget.put("storageToken", summary.getStorageToken());
            budgets.add(budget);
        }
        return budgets;
    }

    private String stripCodeFences(String content) {
        String cleaned = content;
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```(?:json)?\\s*", "");
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3).trim();
        }
        return cleaned;
    }
}