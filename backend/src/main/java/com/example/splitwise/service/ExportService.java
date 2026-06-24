package com.example.splitwise.service;

import com.example.splitwise.model.Expense;
import com.example.splitwise.model.User;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.*;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import com.itextpdf.text.Font;
import com.itextpdf.text.Document;
import java.util.stream.Collectors;

@Service
public class ExportService {

    private static final DateTimeFormatter FMT_DAY =
            DateTimeFormatter.ofPattern("dd MMM yyyy").withZone(ZoneId.systemDefault());
    private static final DateTimeFormatter FMT_MONTH =
            DateTimeFormatter.ofPattern("MMMM yyyy").withZone(ZoneId.systemDefault());

    private static final BaseColor BRAND        = new BaseColor(83, 74, 183);
    private static final BaseColor BRAND_LIGHT  = new BaseColor(238, 237, 254);
    private static final BaseColor ROW_ALT      = new BaseColor(245, 244, 255);
    private static final BaseColor GREEN_BG     = new BaseColor(225, 245, 238);
    private static final BaseColor GREEN_TEXT   = new BaseColor(15, 110, 86);
    private static final BaseColor RED_BG       = new BaseColor(252, 235, 235);
    private static final BaseColor RED_TEXT     = new BaseColor(163, 45, 45);
    private static final BaseColor GRAY_BG      = new BaseColor(241, 239, 232);
    private static final BaseColor GRAY_TEXT    = new BaseColor(95, 94, 90);
    private static final BaseColor WHITE        = BaseColor.WHITE;
    private static final BaseColor TEXT_PRIMARY = new BaseColor(30, 30, 30);
    private static final BaseColor TEXT_MUTED   = new BaseColor(120, 120, 115);

    public record DateRange(Instant from, Instant to) {}

    private ReportData assemble(User user,
                                List<Expense> expenses,
                                Map<String, String> userIdToName,
                                Map<String, String> groupIdToName,
                                DateRange range) {

        String userName  = safe(user.getName());
        String userEmail = safe(user.getEmail());
        String userId    = user.getId();
        String today     = FMT_DAY.format(Instant.now());
        String period    = FMT_DAY.format(range.from()) + " – " + FMT_DAY.format(range.to());


        BigDecimal totalPaid      = BigDecimal.ZERO;
        BigDecimal totalGroupPaid = BigDecimal.ZERO;
        BigDecimal totalSettled   = BigDecimal.ZERO;

        for (Expense e : expenses) {
            BigDecimal amt = amount(e);
            totalPaid = totalPaid.add(amt);
            boolean isGroup = Expense.ExpenseType.GROUP.equals(e.getType());
            if (isGroup) totalGroupPaid = totalGroupPaid.add(amt);
            if ("SETTLED".equalsIgnoreCase(statusStr(e))) totalSettled = totalSettled.add(amt);
        }

        BigDecimal outstanding = totalPaid.subtract(totalSettled);
        int groupPct = totalPaid.compareTo(BigDecimal.ZERO) > 0
                ? totalGroupPaid.multiply(BigDecimal.valueOf(100))
                               .divide(totalPaid, 0, RoundingMode.HALF_UP).intValue()
                : 0;

        Map<String, BigDecimal> byCategory = new LinkedHashMap<>();
        for (Expense e : expenses) {
            String cat = (e.getTag() != null && !e.getTag().isBlank() && !"-".equals(e.getTag()))
                    ? capitalise(e.getTag()) : "Uncategorised";
            byCategory.merge(cat, amount(e), BigDecimal::add);
        }
        List<Map.Entry<String, BigDecimal>> catList = byCategory.entrySet().stream()
                .sorted(Map.Entry.<String, BigDecimal>comparingByValue().reversed())
                .collect(Collectors.toList());

        Map<String, List<Expense>> byMonth = new LinkedHashMap<>();
        for (Expense e : expenses) {
            if (e.getCreatedAt() == null) continue;
            String key = FMT_MONTH.format(e.getCreatedAt());
            byMonth.computeIfAbsent(key, k -> new ArrayList<>()).add(e);
        }

        Map<String, BigDecimal> netByPerson = new LinkedHashMap<>();
        for (Expense e : expenses) {
            if (!Expense.ExpenseType.GROUP.equals(e.getType())) continue;
            if (e.getParticipantIds() == null || e.getParticipantIds().isEmpty()) continue;

            BigDecimal share = amount(e)
                    .divide(BigDecimal.valueOf(e.getParticipantIds().size()), 2, RoundingMode.HALF_UP);

            if (userId.equals(e.getPayerId())) {
                for (String pid : e.getParticipantIds()) {
                    if (!pid.equals(userId)) {
                        String name = userIdToName.getOrDefault(pid, pid);
                        netByPerson.merge(name, share, BigDecimal::add);
                    }
                }
            } else if (e.getParticipantIds().contains(userId)) {
                String payerName = userIdToName.getOrDefault(e.getPayerId(), e.getPayerId());
                netByPerson.merge(payerName, share.negate(), BigDecimal::add);
            }
        }

        BigDecimal netTotal = netByPerson.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new ReportData(
                userName, userEmail, today, period,
                expenses, userIdToName, groupIdToName,
                totalPaid, totalGroupPaid, totalSettled, outstanding,
                groupPct, catList, byMonth, netByPerson, netTotal
        );
    }

    /** Flat DTO passed to all renderers. */
    record ReportData(
            String userName, String userEmail, String today, String period,
            List<Expense> expenses,
            Map<String, String> userIdToName, Map<String, String> groupIdToName,
            BigDecimal totalPaid, BigDecimal totalGroupPaid,
            BigDecimal totalSettled, BigDecimal outstanding,
            int groupPct,
            List<Map.Entry<String, BigDecimal>> catList,
            Map<String, List<Expense>> byMonth,
            Map<String, BigDecimal> netByPerson,
            BigDecimal netTotal
    ) {}

    public byte[] generatePdf(User user, List<Expense> expenses,
                               Map<String, String> userIdToName,
                               Map<String, String> groupIdToName,
                               DateRange range) throws Exception {

        ReportData r = assemble(user, expenses, userIdToName, groupIdToName, range);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4, 40, 40, 50, 50);
        PdfWriter writer = PdfWriter.getInstance(doc, out);

        writer.setPageEvent(new PdfPageEventHelper() {
            final Font f = new Font(Font.FontFamily.HELVETICA, 8, Font.NORMAL, TEXT_MUTED);
            @Override public void onEndPage(PdfWriter w, Document d) {
                PdfContentByte cb = w.getDirectContent();
                Phrase footer = new Phrase("Finwise · Page " + w.getPageNumber(), f);
                ColumnText.showTextAligned(cb, Element.ALIGN_CENTER, footer,
                        (d.left() + d.right()) / 2, d.bottom() - 18, 0);
            }
        });

        doc.open();

        Font fTitle  = new Font(Font.FontFamily.HELVETICA, 22, Font.BOLD,   BRAND);
        Font fH2     = new Font(Font.FontFamily.HELVETICA, 13, Font.BOLD,   TEXT_PRIMARY);
        Font fH3     = new Font(Font.FontFamily.HELVETICA, 10, Font.BOLD,   TEXT_PRIMARY);
        Font fBody   = new Font(Font.FontFamily.HELVETICA,  9, Font.NORMAL, TEXT_PRIMARY);
        Font fMuted  = new Font(Font.FontFamily.HELVETICA,  8, Font.NORMAL, TEXT_MUTED);
        Font fWhite  = new Font(Font.FontFamily.HELVETICA,  9, Font.BOLD,   WHITE);
        Font fGreen  = new Font(Font.FontFamily.HELVETICA,  9, Font.BOLD,   GREEN_TEXT);
        Font fRed    = new Font(Font.FontFamily.HELVETICA,  9, Font.BOLD,   RED_TEXT);

        PdfPTable header = new PdfPTable(2);
        header.setWidthPercentage(100);
        header.setWidths(new float[]{3f, 1.5f});
        header.setSpacingAfter(18);

        PdfPCell logoCell = new PdfPCell();
        logoCell.setBorder(Rectangle.BOTTOM);
        logoCell.setBorderColorBottom(BRAND);
        logoCell.setBorderWidthBottom(2f);
        logoCell.setPaddingBottom(10);
        logoCell.addElement(new Paragraph("Finwise", fTitle));
        logoCell.addElement(new Paragraph("Expense Report", fH2));
        header.addCell(logoCell);

        PdfPCell metaCell = new PdfPCell();
        metaCell.setBorder(Rectangle.BOTTOM);
        metaCell.setBorderColorBottom(BRAND);
        metaCell.setBorderWidthBottom(2f);
        metaCell.setPaddingBottom(10);
        metaCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        metaCell.addElement(new Paragraph(r.userName(), fBody));
        metaCell.addElement(new Paragraph(r.userEmail(), fMuted));
        metaCell.addElement(new Paragraph("Generated: " + r.today(), fMuted));
        metaCell.addElement(new Paragraph("Period: " + r.period(), fMuted));
        metaCell.addElement(new Paragraph("Transactions: " + r.expenses().size(), fMuted));
        header.addCell(metaCell);
        doc.add(header);

        doc.add(new Paragraph("Financial Summary", fH2));
        doc.add(Chunk.NEWLINE);

        PdfPTable kpi = new PdfPTable(4);
        kpi.setWidthPercentage(100);
        kpi.setSpacingAfter(16);
        addKpiCell(kpi, "Total paid out",   "₹" + fmt(r.totalPaid()),    BRAND_LIGHT,  fH3, fBody);
        addKpiCell(kpi, "Settled/recovered","₹" + fmt(r.totalSettled()), GREEN_BG,     fH3, fGreen);
        addKpiCell(kpi, "Outstanding",      "₹" + fmt(r.outstanding()),  RED_BG,       fH3, fRed);
        addKpiCell(kpi, "Group vs personal", r.groupPct() + "% / " + (100 - r.groupPct()) + "%", GRAY_BG, fH3, fBody);
        doc.add(kpi);

        doc.add(new Paragraph("Spending by Category", fH2));
        doc.add(Chunk.NEWLINE);

        PdfPTable catTable = new PdfPTable(3);
        catTable.setWidthPercentage(100);
        catTable.setWidths(new float[]{2f, 1.2f, 0.8f});
        catTable.setSpacingAfter(16);

        addTableHeader(catTable, fWhite, "Category", "Amount (INR)", "Share");
        for (Map.Entry<String, BigDecimal> entry : r.catList()) {
            int pct = r.totalPaid().compareTo(BigDecimal.ZERO) > 0
                    ? entry.getValue().multiply(BigDecimal.valueOf(100))
                                      .divide(r.totalPaid(), 0, RoundingMode.HALF_UP).intValue() : 0;
            addBodyRow(catTable, fBody, entry.getKey(), "₹" + fmt(entry.getValue()), pct + "%");
        }
        doc.add(catTable);

        doc.add(new Paragraph("Monthly Breakdown", fH2));

        for (Map.Entry<String, List<Expense>> monthEntry : r.byMonth().entrySet()) {
            doc.add(Chunk.NEWLINE);
            List<Expense> mes = monthEntry.getValue();

            BigDecimal monthTotal = mes.stream().map(this::amount).reduce(BigDecimal.ZERO, BigDecimal::add);
            long groupCount = mes.stream().filter(e -> Expense.ExpenseType.GROUP.equals(e.getType())).count();
            long personalCount = mes.size() - groupCount;

            PdfPTable monthHeader = new PdfPTable(1);
            monthHeader.setWidthPercentage(100);
            monthHeader.setSpacingBefore(6);
            PdfPCell mhCell = new PdfPCell(new Phrase(
                    monthEntry.getKey() + "   ·   " + mes.size() + " transactions   ·   ₹" + fmt(monthTotal)
                    + "   ·   " + groupCount + " group  /  " + personalCount + " personal", fWhite));
            mhCell.setBackgroundColor(BRAND);
            mhCell.setPadding(7);
            monthHeader.addCell(mhCell);
            doc.add(monthHeader);

            PdfPTable expTable = new PdfPTable(6);
            expTable.setWidthPercentage(100);
            expTable.setWidths(new float[]{2.8f, 1.1f, 1f, 1.5f, 1.3f, 1.1f});
            expTable.setSpacingAfter(4);
            addTableHeader(expTable, fWhite, "Description", "Amount", "Currency", "Group / Type", "Category", "Status");

            boolean alt = false;
            for (Expense e : mes) {
                BaseColor bg = alt ? ROW_ALT : WHITE;
                alt = !alt;
                boolean settled = "SETTLED".equalsIgnoreCase(statusStr(e));
                Font statusFont = settled ? fGreen : fRed;

                String groupLabel = Expense.ExpenseType.GROUP.equals(e.getType())
                        ? r.groupIdToName().getOrDefault(e.getGroupId(), "Group")
                        : "Personal";
                String cat = (e.getTag() != null && !e.getTag().isBlank() && !"-".equals(e.getTag()))
                        ? e.getTag() : "—";

                addBodyRowColored(expTable, fBody, bg,
                        safe(e.getDescription()),
                        fmt(amount(e)),
                        e.getCurrency() != null ? e.getCurrency() : "INR",
                        groupLabel,
                        cat,
                        null
                );

                PdfPCell statusCell = new PdfPCell(new Phrase(statusStr(e), statusFont));
                statusCell.setBackgroundColor(bg);
                statusCell.setPadding(5);
                expTable.addCell(statusCell);
            }
            doc.add(expTable);
        }

        doc.add(Chunk.NEWLINE);
        doc.add(new Paragraph("Settlement Summary", fH2));
        doc.add(Chunk.NEWLINE);

        PdfPTable settleTable = new PdfPTable(2);
        settleTable.setWidthPercentage(60);
        settleTable.setHorizontalAlignment(Element.ALIGN_LEFT);
        settleTable.setSpacingAfter(10);

        for (Map.Entry<String, BigDecimal> entry : r.netByPerson().entrySet()) {
            boolean positive = entry.getValue().compareTo(BigDecimal.ZERO) >= 0;
            String label = positive
                    ? entry.getKey() + " owes you"
                    : "You owe " + entry.getKey();
            String value = (positive ? "+ " : "– ") + "₹" + fmt(entry.getValue().abs());
            PdfPCell lc = new PdfPCell(new Phrase(label, fBody));
            lc.setBorder(Rectangle.BOTTOM);
            lc.setBorderColor(GRAY_BG);
            lc.setPadding(6);
            PdfPCell vc = new PdfPCell(new Phrase(value, positive ? fGreen : fRed));
            vc.setBorder(Rectangle.BOTTOM);
            vc.setBorderColor(GRAY_BG);
            vc.setPadding(6);
            vc.setHorizontalAlignment(Element.ALIGN_RIGHT);
            settleTable.addCell(lc);
            settleTable.addCell(vc);
        }

        boolean netPositive = r.netTotal().compareTo(BigDecimal.ZERO) >= 0;
        PdfPCell ntLabel = new PdfPCell(new Phrase("Net position", fH3));
        ntLabel.setBackgroundColor(BRAND_LIGHT); ntLabel.setPadding(7);
        PdfPCell ntVal = new PdfPCell(new Phrase(
                (netPositive ? "+ " : "– ") + "₹" + fmt(r.netTotal().abs()),
                netPositive ? fGreen : fRed));
        ntVal.setBackgroundColor(BRAND_LIGHT);
        ntVal.setPadding(7);
        ntVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
        settleTable.addCell(ntLabel);
        settleTable.addCell(ntVal);
        doc.add(settleTable);

        doc.close();
        return out.toByteArray();
    }

    private void addKpiCell(PdfPTable t, String label, String value,
                             BaseColor bg, Font vFont, Font lFont) {
        PdfPCell c = new PdfPCell();
        c.setBackgroundColor(bg);
        c.setPadding(10);
        c.setBorder(Rectangle.NO_BORDER);
        c.addElement(new Paragraph(label, lFont));
        Paragraph vp = new Paragraph(value, vFont);
        vp.setSpacingBefore(4);
        c.addElement(vp);
        t.addCell(c);
    }

    private void addTableHeader(PdfPTable t, Font f, String... headers) {
        for (String h : headers) {
            PdfPCell c = new PdfPCell(new Phrase(h, f));
            c.setBackgroundColor(BRAND);
            c.setPadding(6);
            t.addCell(c);
        }
    }

    private void addBodyRow(PdfPTable t, Font f, String... values) {
        addBodyRowColored(t, f, WHITE, values);
    }

    private void addBodyRowColored(PdfPTable t, Font f, BaseColor bg, String... values) {
        for (String v : values) {
            if (v == null) continue; // caller handles null cells manually
            PdfPCell c = new PdfPCell(new Phrase(v, f));
            c.setBackgroundColor(bg);
            c.setPadding(5);
            t.addCell(c);
        }
    }

    public byte[] generateExcel(User user, List<Expense> expenses,
                                 Map<String, String> userIdToName,
                                 Map<String, String> groupIdToName,
                                 DateRange range) throws Exception {

        ReportData r = assemble(user, expenses, userIdToName, groupIdToName, range);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try (XSSFWorkbook wb = new XSSFWorkbook()) {

            XSSFCellStyle brandHeader = xlStyle(wb, "534AB7", "FFFFFF", true,  (short)10, true);
            XSSFCellStyle altRow      = xlStyle(wb, "F5F4FF", "1E1E1E", false, (short)9,  false);
            XSSFCellStyle normRow     = xlStyle(wb, "FFFFFF", "1E1E1E", false, (short)9,  false);
            XSSFCellStyle kpiLabel    = xlStyle(wb, "EEEDFE", "534AB7", true,  (short)9,  false);
            XSSFCellStyle greenStyle  = xlStyle(wb, "E1F5EE", "0F6E56", true,  (short)9,  false);
            XSSFCellStyle redStyle    = xlStyle(wb, "FCEBEB", "A32D2D", true,  (short)9,  false);
            XSSFCellStyle titleStyle  = xlStyle(wb, "FFFFFF", "534AB7", true,  (short)16, false);
            XSSFCellStyle mutedStyle  = xlStyle(wb, "FFFFFF", "787870", false, (short)9,  false);
            XSSFCellStyle monthHeader = xlStyle(wb, "534AB7", "FFFFFF", true,  (short)10, false);

            Sheet summary = wb.createSheet("Summary");
            summary.setColumnWidth(0, 7000); summary.setColumnWidth(1, 5000);

            int sr = 0;
            xlCell(summary, sr++, 0, "Finwise — Expense Report", titleStyle);
            xlCell(summary, sr++, 0, r.userName() + " · " + r.userEmail(), mutedStyle);
            xlCell(summary, sr++, 0, "Period: " + r.period(), mutedStyle);
            xlCell(summary, sr++, 0, "Generated: " + r.today() + "  ·  Transactions: " + r.expenses().size(), mutedStyle);
            sr++;

            xlCell(summary, sr++, 0, "FINANCIAL SUMMARY", brandHeader);
            xlCell(summary, sr, 0, "Total paid out",     kpiLabel); xlCell(summary, sr++, 1, "₹" + fmt(r.totalPaid()),    kpiLabel);
            xlCell(summary, sr, 0, "Settled/recovered",  kpiLabel); xlCell(summary, sr++, 1, "₹" + fmt(r.totalSettled()), greenStyle);
            xlCell(summary, sr, 0, "Outstanding",        kpiLabel); xlCell(summary, sr++, 1, "₹" + fmt(r.outstanding()),  redStyle);
            xlCell(summary, sr, 0, "Group vs personal",  kpiLabel); xlCell(summary, sr++, 1, r.groupPct() + "% / " + (100 - r.groupPct()) + "%", kpiLabel);
            sr++;

            xlCell(summary, sr++, 0, "SPENDING BY CATEGORY", brandHeader);
            xlCell(summary, sr, 0, "Category", brandHeader); xlCell(summary, sr, 1, "Amount (INR)", brandHeader); xlCell(summary, sr++, 2, "Share %", brandHeader);
            summary.setColumnWidth(2, 3500);
            for (Map.Entry<String, BigDecimal> entry : r.catList()) {
                int pct = r.totalPaid().compareTo(BigDecimal.ZERO) > 0
                        ? entry.getValue().multiply(BigDecimal.valueOf(100))
                                          .divide(r.totalPaid(), 0, RoundingMode.HALF_UP).intValue() : 0;
                xlCell(summary, sr, 0, entry.getKey(),          normRow);
                xlCell(summary, sr, 1, "₹" + fmt(entry.getValue()), normRow);
                xlCell(summary, sr++, 2, pct + "%",             normRow);
            }
            sr++;

            xlCell(summary, sr++, 0, "SETTLEMENT SUMMARY", brandHeader);
            xlCell(summary, sr, 0, "Person",       brandHeader); xlCell(summary, sr++, 1, "Net amount", brandHeader);
            for (Map.Entry<String, BigDecimal> entry : r.netByPerson().entrySet()) {
                boolean pos = entry.getValue().compareTo(BigDecimal.ZERO) >= 0;
                xlCell(summary, sr, 0, pos ? entry.getKey() + " owes you" : "You owe " + entry.getKey(), normRow);
                xlCell(summary, sr++, 1, (pos ? "+ " : "– ") + "₹" + fmt(entry.getValue().abs()), pos ? greenStyle : redStyle);
            }
            xlCell(summary, sr, 0, "Net position", kpiLabel);
            boolean np = r.netTotal().compareTo(BigDecimal.ZERO) >= 0;
            xlCell(summary, sr, 1,
                    (np ? "+ " : "– ") + "₹" + fmt(r.netTotal().abs()),
                    np ? greenStyle : redStyle);

            Sheet byMonthSheet = wb.createSheet("By Month");
            int[] monthColWidths = {7000, 3500, 2500, 5000, 3500, 3000};
            for (int i = 0; i < monthColWidths.length; i++) byMonthSheet.setColumnWidth(i, monthColWidths[i]);

            int mr = 0;
            for (Map.Entry<String, List<Expense>> monthEntry : r.byMonth().entrySet()) {
                List<Expense> mes = monthEntry.getValue();
                BigDecimal monthTotal = mes.stream().map(this::amount).reduce(BigDecimal.ZERO, BigDecimal::add);

                Row mRow = byMonthSheet.createRow(mr++);
                Cell mCell = mRow.createCell(0);
                mCell.setCellValue(monthEntry.getKey() + "   ·   " + mes.size()
                        + " transactions   ·   ₹" + fmt(monthTotal));
                mCell.setCellStyle(monthHeader);
                byMonthSheet.addMergedRegion(new CellRangeAddress(mr - 1, mr - 1, 0, 5));

                String[] cols = {"Description", "Amount", "Currency", "Group / Type", "Category", "Status"};
                Row hRow = byMonthSheet.createRow(mr++);
                for (int i = 0; i < cols.length; i++) {
                    Cell c = hRow.createCell(i);
                    c.setCellValue(cols[i]);
                    c.setCellStyle(brandHeader);
                }

                boolean alt = false;
                for (Expense e : mes) {
                    XSSFCellStyle rowStyle = alt ? altRow : normRow;
                    alt = !alt;
                    Row dr = byMonthSheet.createRow(mr++);
                    xlCell(dr, 0, safe(e.getDescription()),  rowStyle);
                    xlCell(dr, 1, fmt(amount(e)),             rowStyle);
                    xlCell(dr, 2, e.getCurrency() != null ? e.getCurrency() : "INR", rowStyle);
                    xlCell(dr, 3, Expense.ExpenseType.GROUP.equals(e.getType())
                            ? r.groupIdToName().getOrDefault(e.getGroupId(), "Group") : "Personal", rowStyle);
                    xlCell(dr, 4, (e.getTag() != null && !e.getTag().isBlank() && !"-".equals(e.getTag())) ? e.getTag() : "—", rowStyle);
                    boolean settled = "SETTLED".equalsIgnoreCase(statusStr(e));
                    xlCell(dr, 5, statusStr(e), settled ? greenStyle : redStyle);
                }
                mr++; // blank row between months
            }

            Sheet byGroupSheet = wb.createSheet("By Group");
            byGroupSheet.setColumnWidth(0, 7000); byGroupSheet.setColumnWidth(1, 3500);
            byGroupSheet.setColumnWidth(2, 2500); byGroupSheet.setColumnWidth(3, 4000);

            Map<String, List<Expense>> byGroup = r.expenses().stream()
                    .filter(e -> Expense.ExpenseType.GROUP.equals(e.getType()))
                    .collect(Collectors.groupingBy(
                            e -> r.groupIdToName().getOrDefault(e.getGroupId(), "Unknown Group"),
                            LinkedHashMap::new, Collectors.toList()));

            int gr = 0;
            for (Map.Entry<String, List<Expense>> gEntry : byGroup.entrySet()) {
                List<Expense> ges = gEntry.getValue();
                BigDecimal gTotal = ges.stream().map(this::amount).reduce(BigDecimal.ZERO, BigDecimal::add);

                Row ghRow = byGroupSheet.createRow(gr++);
                Cell ghCell = ghRow.createCell(0);
                ghCell.setCellValue(gEntry.getKey() + "   ·   " + ges.size() + " expenses   ·   ₹" + fmt(gTotal));
                ghCell.setCellStyle(monthHeader);
                byGroupSheet.addMergedRegion(new CellRangeAddress(gr - 1, gr - 1, 0, 3));

                String[] gcols = {"Description", "Amount", "Category", "Status"};
                Row ghdr = byGroupSheet.createRow(gr++);
                for (int i = 0; i < gcols.length; i++) {
                    Cell c = ghdr.createCell(i); c.setCellValue(gcols[i]); c.setCellStyle(brandHeader);
                }
                boolean alt = false;
                for (Expense e : ges) {
                    XSSFCellStyle rs = alt ? altRow : normRow; alt = !alt;
                    Row dr = byGroupSheet.createRow(gr++);
                    xlCell(dr, 0, safe(e.getDescription()), rs);
                    xlCell(dr, 1, fmt(amount(e)), rs);
                    xlCell(dr, 2, (e.getTag() != null && !e.getTag().isBlank() && !"-".equals(e.getTag())) ? e.getTag() : "—", rs);
                    xlCell(dr, 3, statusStr(e), "SETTLED".equalsIgnoreCase(statusStr(e)) ? greenStyle : redStyle);
                }
                gr++;
            }

            Sheet raw = wb.createSheet("Raw Data");
            String[] rawCols = {"#", "Description", "Amount", "Currency", "Category",
                    "Paid By", "Type", "Date", "Group", "Status", "Participants"};
            int[] rawWidths = {1500, 6000, 3000, 2500, 3500, 4000, 3000, 4000, 5000, 3500, 8000};
            for (int i = 0; i < rawWidths.length; i++) raw.setColumnWidth(i, rawWidths[i]);

            Row rawH = raw.createRow(0);
            for (int i = 0; i < rawCols.length; i++) {
                Cell c = rawH.createCell(i); c.setCellValue(rawCols[i]); c.setCellStyle(brandHeader);
            }
            boolean ralt = false;
            for (int i = 0; i < r.expenses().size(); i++) {
                Expense e = r.expenses().get(i);
                XSSFCellStyle rs = ralt ? altRow : normRow; ralt = !ralt;
                Row dr = raw.createRow(i + 1);
                xlCell(dr, 0,  String.valueOf(i + 1),                               rs);
                xlCell(dr, 1,  safe(e.getDescription()),                             rs);
                xlCell(dr, 2,  fmt(amount(e)),                                       rs);
                xlCell(dr, 3,  e.getCurrency() != null ? e.getCurrency() : "INR",   rs);
                xlCell(dr, 4,  safe(e.getTag()),                                     rs);
                xlCell(dr, 5,  r.userIdToName().getOrDefault(e.getPayerId(), "-"),   rs);
                xlCell(dr, 6,  e.getType() != null ? e.getType().name() : "-",      rs);
                xlCell(dr, 7,  e.getCreatedAt() != null ? FMT_DAY.format(e.getCreatedAt()) : "-", rs);
                xlCell(dr, 8,  Expense.ExpenseType.GROUP.equals(e.getType())
                        ? r.groupIdToName().getOrDefault(e.getGroupId(), "-") : "Personal", rs);
                xlCell(dr, 9,  statusStr(e),                                         rs);
                xlCell(dr, 10, participants(e, r.userIdToName()),                    rs);
            }

            wb.write(out);
        }
        return out.toByteArray();
    }

    private XSSFCellStyle xlStyle(XSSFWorkbook wb, String bgHex, String fgHex,
                                   boolean bold, short fontSize, boolean borders) {
        XSSFCellStyle s = wb.createCellStyle();
        s.setFillForegroundColor(new XSSFColor(hexToBytes(bgHex), null));
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        XSSFFont f = wb.createFont();
        f.setBold(bold);
        f.setFontHeightInPoints(fontSize);
        f.setColor(new XSSFColor(hexToBytes(fgHex), null));
        s.setFont(f);
        s.setVerticalAlignment(VerticalAlignment.CENTER);
        if (borders) {
            s.setBorderBottom(BorderStyle.THIN);
            s.setBorderTop(BorderStyle.THIN);
            s.setBorderLeft(BorderStyle.THIN);
            s.setBorderRight(BorderStyle.THIN);
        }
        s.setWrapText(false);
        return s;
    }

    private void xlCell(Sheet sheet, int row, int col, String value, CellStyle style) {
        Row r = sheet.getRow(row);
        if (r == null) r = sheet.createRow(row);
        xlCell(r, col, value, style);
    }

    private void xlCell(Row row, int col, String value, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(value != null ? value : "");
        if (style != null) c.setCellStyle(style);
    }

    private byte[] hexToBytes(String hex) {
        return new byte[]{
                (byte) Integer.parseInt(hex.substring(0, 2), 16),
                (byte) Integer.parseInt(hex.substring(2, 4), 16),
                (byte) Integer.parseInt(hex.substring(4, 6), 16)
        };
    }

    public byte[] generateWord(User user, List<Expense> expenses,
                                Map<String, String> userIdToName,
                                Map<String, String> groupIdToName,
                                DateRange range) throws Exception {

        ReportData r = assemble(user, expenses, userIdToName, groupIdToName, range);
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try (XWPFDocument doc = new XWPFDocument()) {

            XWPFParagraph title = doc.createParagraph();
            title.setAlignment(ParagraphAlignment.LEFT);
            XWPFRun tr = title.createRun();
            tr.setText("Finwise"); tr.setBold(true); tr.setFontSize(24); tr.setColor("534AB7");

            XWPFParagraph subtitle = doc.createParagraph();
            XWPFRun sr2 = subtitle.createRun();
            sr2.setText("Expense Report"); sr2.setBold(true); sr2.setFontSize(16); sr2.setColor("1E1E1E");

            wordMeta(doc, "Name",        r.userName());
            wordMeta(doc, "Email",       r.userEmail());
            wordMeta(doc, "Period",      r.period());
            wordMeta(doc, "Generated",   r.today());
            wordMeta(doc, "Transactions", String.valueOf(r.expenses().size()));
            doc.createParagraph();

            wordH2(doc, "Financial Summary");
            XWPFTable kpiTable = doc.createTable(2, 4);
            kpiTable.setWidth("100%");
            String[] kpiLabels  = {"Total paid out", "Settled/recovered", "Outstanding", "Group vs personal"};
            String[] kpiValues  = {"₹" + fmt(r.totalPaid()), "₹" + fmt(r.totalSettled()),
                                   "₹" + fmt(r.outstanding()), r.groupPct() + "% / " + (100 - r.groupPct()) + "%"};
            String[] kpiColors  = {"EEEDFE", "E1F5EE", "FCEBEB", "F1EFE8"};
            String[] kpiTxtClr  = {"534AB7", "0F6E56", "A32D2D", "5F5E5A"};
            for (int i = 0; i < 4; i++) {
                wordKpiCell(kpiTable.getRow(0).getCell(i), kpiLabels[i], "534AB7", false, 9);
                wordKpiCell(kpiTable.getRow(1).getCell(i), kpiValues[i], kpiTxtClr[i], true, 13);
                kpiTable.getRow(0).getCell(i).setColor(kpiColors[i]);
                kpiTable.getRow(1).getCell(i).setColor(kpiColors[i]);
            }
            doc.createParagraph();

            wordH2(doc, "Spending by Category");
            XWPFTable catTbl = doc.createTable(r.catList().size() + 1, 3);
            catTbl.setWidth("60%");
            wordTableHeader(catTbl, "Category", "Amount (INR)", "Share");
            for (int i = 0; i < r.catList().size(); i++) {
                Map.Entry<String, BigDecimal> entry = r.catList().get(i);
                int pct = r.totalPaid().compareTo(BigDecimal.ZERO) > 0
                        ? entry.getValue().multiply(BigDecimal.valueOf(100))
                                          .divide(r.totalPaid(), 0, RoundingMode.HALF_UP).intValue() : 0;
                String bg = i % 2 == 0 ? "FFFFFF" : "F5F4FF";
                wordRow(catTbl, i + 1, bg, entry.getKey(), "₹" + fmt(entry.getValue()), pct + "%");
            }
            doc.createParagraph();

            wordH2(doc, "Monthly Breakdown");

            for (Map.Entry<String, List<Expense>> monthEntry : r.byMonth().entrySet()) {
                List<Expense> mes = monthEntry.getValue();
                BigDecimal mTotal = mes.stream().map(this::amount).reduce(BigDecimal.ZERO, BigDecimal::add);

                XWPFParagraph mp = doc.createParagraph();
                XWPFRun mr3 = mp.createRun();
                mr3.setText(monthEntry.getKey() + "   ·   " + mes.size() + " transactions   ·   ₹" + fmt(mTotal));
                mr3.setBold(true); mr3.setFontSize(11); mr3.setColor("534AB7");

                XWPFTable mTbl = doc.createTable(mes.size() + 1, 5);
                mTbl.setWidth("100%");
                wordTableHeader(mTbl, "Description", "Amount", "Group / Type", "Category", "Status");

                for (int i = 0; i < mes.size(); i++) {
                    Expense e = mes.get(i);
                    String bg = i % 2 == 0 ? "FFFFFF" : "F5F4FF";
                    boolean settled = "SETTLED".equalsIgnoreCase(statusStr(e));
                    String groupLabel = Expense.ExpenseType.GROUP.equals(e.getType())
                            ? r.groupIdToName().getOrDefault(e.getGroupId(), "Group") : "Personal";
                    String cat = (e.getTag() != null && !e.getTag().isBlank() && !"-".equals(e.getTag())) ? e.getTag() : "—";
                    wordRow(mTbl, i + 1, bg,
                            safe(e.getDescription()),
                            fmt(amount(e)),
                            groupLabel,
                            cat,
                            statusStr(e));

                    XWPFTableCell sc = mTbl.getRow(i + 1).getCell(4);
                    sc.setColor(settled ? "E1F5EE" : "FCEBEB");
                    XWPFRun scr = sc.getParagraphs().get(0).getRuns().isEmpty()
                            ? sc.getParagraphs().get(0).createRun()
                            : sc.getParagraphs().get(0).getRuns().get(0);
                    scr.setColor(settled ? "0F6E56" : "A32D2D");
                }
                doc.createParagraph();
            }

            wordH2(doc, "Settlement Summary");
            XWPFTable sTbl = doc.createTable(r.netByPerson().size() + 2, 2);
            sTbl.setWidth("60%");
            wordTableHeader(sTbl, "Person", "Net amount");

            int si = 1;
            for (Map.Entry<String, BigDecimal> entry : r.netByPerson().entrySet()) {
                boolean pos = entry.getValue().compareTo(BigDecimal.ZERO) >= 0;
                String bg = si % 2 == 0 ? "FFFFFF" : "F5F4FF";
                wordRow(sTbl, si, bg,
                        pos ? entry.getKey() + " owes you" : "You owe " + entry.getKey(),
                        (pos ? "+ " : "– ") + "₹" + fmt(entry.getValue().abs()));
                XWPFTableCell vc = sTbl.getRow(si).getCell(1);
                vc.setColor(pos ? "E1F5EE" : "FCEBEB");
                if (!vc.getParagraphs().get(0).getRuns().isEmpty())
                    vc.getParagraphs().get(0).getRuns().get(0).setColor(pos ? "0F6E56" : "A32D2D");
                si++;
            }
            boolean np = r.netTotal().compareTo(BigDecimal.ZERO) >= 0;
            wordRow(sTbl, si, "EEEDFE", "Net position",
                    (np ? "+ " : "– ") + "₹" + fmt(r.netTotal().abs()));
            XWPFTableCell ntc = sTbl.getRow(si).getCell(1);
            ntc.setColor(np ? "E1F5EE" : "FCEBEB");
            if (!ntc.getParagraphs().get(0).getRuns().isEmpty())
                ntc.getParagraphs().get(0).getRuns().get(0).setColor(np ? "0F6E56" : "A32D2D");

            doc.write(out);
        }
        return out.toByteArray();
    }

    private void wordH2(XWPFDocument doc, String text) {
        XWPFParagraph p = doc.createParagraph();
        p.setSpacingBefore(200);
        XWPFRun run = p.createRun();
        run.setText(text); run.setBold(true); run.setFontSize(13); run.setColor("1E1E1E");
    }

    private void wordMeta(XWPFDocument doc, String label, String value) {
        XWPFParagraph p = doc.createParagraph();
        XWPFRun r = p.createRun();
        r.setText(label + ": "); r.setBold(true); r.setFontSize(9); r.setColor("534AB7");
        XWPFRun v = p.createRun();
        v.setText(value); v.setFontSize(9); v.setColor("5F5E5A");
    }

    private void wordKpiCell(XWPFTableCell cell, String text, String color, boolean bold, int size) {
        XWPFParagraph p = cell.getParagraphs().isEmpty() ? cell.addParagraph() : cell.getParagraphs().get(0);
        XWPFRun run = p.createRun();
        run.setText(text); run.setBold(bold); run.setFontSize(size); run.setColor(color);
    }

    private void wordTableHeader(XWPFTable table, String... headers) {
        XWPFTableRow row = table.getRow(0);
        for (int i = 0; i < headers.length; i++) {
            XWPFTableCell cell = row.getCell(i);
            cell.setColor("534AB7");
            XWPFRun run = cell.getParagraphs().get(0).createRun();
            run.setText(headers[i]); run.setBold(true); run.setFontSize(9); run.setColor("FFFFFF");
        }
    }

    private void wordRow(XWPFTable table, int rowIdx, String bg, String... values) {
        XWPFTableRow row = table.getRow(rowIdx);
        for (int i = 0; i < values.length && i < row.getTableCells().size(); i++) {
            XWPFTableCell cell = row.getCell(i);
            cell.setColor(bg);
            XWPFParagraph p = cell.getParagraphs().isEmpty() ? cell.addParagraph() : cell.getParagraphs().get(0);
            XWPFRun run = p.getRuns().isEmpty() ? p.createRun() : p.getRuns().get(0);
            run.setText(values[i]); run.setFontSize(9); run.setColor("1E1E1E");
        }
    }

    private BigDecimal amount(Expense e) {
        return (e.getAmount() != null) ? e.getAmount() : BigDecimal.ZERO;
    }

    private String fmt(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String statusStr(Expense e) {
        if (Expense.ExpenseType.PERSONAL.equals(e.getType())) {
            return "SETTLED";
        }
        return e.getExpenseStatus() != null ? e.getExpenseStatus().name() : "—";
    }

    private String safe(String value) {
        return (value != null && !value.isBlank()) ? value : "—";
    }

    private String capitalise(String s) {
        if (s == null || s.isBlank()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase();
    }

    private String participants(Expense expense, Map<String, String> userIdToName) {
        if (expense.getParticipantIds() == null || expense.getParticipantIds().isEmpty()) return "—";
        return expense.getParticipantIds().stream()
                .map(id -> userIdToName.getOrDefault(id, id))
                .collect(Collectors.joining(", "));
    }
}