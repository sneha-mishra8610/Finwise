package com.example.splitwise.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.temporal.IsoFields;

@Service
public class FinancialPeriodService {

    public record DateRange(Instant from, Instant to) {}

    public DateRange resolvePeriod(String period) {
        if (period == null || period.isBlank() || period.equalsIgnoreCase("all")) {
            return new DateRange(Instant.EPOCH, Instant.now());
        }

        ZoneId zone = ZoneId.systemDefault();
        LocalDate today = LocalDate.now(zone);

        LocalDate start = switch (period.toLowerCase()) {
            case "today" -> today;
            case "this_week" -> today.with(java.time.DayOfWeek.MONDAY);
            case "this_month" -> today.withDayOfMonth(1);
            case "this_quarter" -> {
                int q = today.get(IsoFields.QUARTER_OF_YEAR);
                yield LocalDate.of(today.getYear(), (q - 1) * 3 + 1, 1);
            }
            case "this_year" -> LocalDate.of(today.getYear(), 1, 1);
            default -> LocalDate.EPOCH;
        };

        Instant from = start.atStartOfDay(zone).toInstant();
        Instant to = today.plusDays(1).atStartOfDay(zone).toInstant();
        return new DateRange(from, to);
    }

    public DateRange previousPeriod(String period) {
        if (period == null || period.isBlank() || period.equalsIgnoreCase("all")) {
            return null;
        }

        ZoneId zone = ZoneId.systemDefault();
        ZonedDateTime start = resolvePeriod(period).from().atZone(zone);
        ZonedDateTime end = resolvePeriod(period).to().atZone(zone);

        return switch (period.toLowerCase()) {
            case "today" -> new DateRange(start.minusDays(1).toInstant(), end.minusDays(1).toInstant());
            case "this_week" -> new DateRange(start.minusWeeks(1).toInstant(), end.minusWeeks(1).toInstant());
            case "this_month" -> new DateRange(start.minusMonths(1).toInstant(), end.minusMonths(1).toInstant());
            case "this_quarter" -> new DateRange(start.minusMonths(3).toInstant(), end.minusMonths(3).toInstant());
            case "this_year" -> new DateRange(start.minusYears(1).toInstant(), end.minusYears(1).toInstant());
            default -> null;
        };
    }

    public String toBudgetPeriod(String period) {
        if (period == null) return null;
        return switch (period.toLowerCase()) {
            case "today" -> "DAILY";
            case "this_week" -> "WEEKLY";
            case "this_month" -> "MONTHLY";
            case "this_quarter" -> "QUARTERLY";
            case "this_year" -> "YEARLY";
            default -> null;
        };
    }
}