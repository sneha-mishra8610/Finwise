package com.example.splitwise.service;

import com.example.splitwise.model.Expense;
import com.example.splitwise.model.User;
import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Chunk;
import com.itextpdf.text.Document;
import com.itextpdf.text.Element;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xwpf.usermodel.ParagraphAlignment;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExportService {

    private static final DateTimeFormatter FMT =
        DateTimeFormatter.ofPattern("dd MMM yyyy").withZone(ZoneId.systemDefault());

    private static final String[] COLUMNS = {
        "Description", "Amount", "Currency", "Category", "Paid By",
        "Type", "Date", "Group", "Status", "Participants"
    };

    public byte[] generatePdf(User user, List<Expense> expenses, Map<String, String> userIdToName, Map<String, String> groupIdToName) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document doc = new Document(PageSize.A4.rotate(), 32, 32, 40, 40);
        PdfWriter.getInstance(doc, out);
        doc.open();

        com.itextpdf.text.Font titleFont = new com.itextpdf.text.Font(
            com.itextpdf.text.Font.FontFamily.HELVETICA, 18,
            com.itextpdf.text.Font.BOLD, BaseColor.BLACK);
        com.itextpdf.text.Font headFont = new com.itextpdf.text.Font(
            com.itextpdf.text.Font.FontFamily.HELVETICA, 9,
            com.itextpdf.text.Font.BOLD, BaseColor.WHITE);
        com.itextpdf.text.Font bodyFont = new com.itextpdf.text.Font(
            com.itextpdf.text.Font.FontFamily.HELVETICA, 8,
            com.itextpdf.text.Font.NORMAL, BaseColor.BLACK);

        Paragraph title = new Paragraph("Expense Report", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        doc.add(title);
        doc.add(new Paragraph("Generated for: " + safe(user.getName()) + " (" + safe(user.getEmail()) + ")", bodyFont));
        doc.add(new Paragraph("Date: " + FMT.format(Instant.now()), bodyFont));
        doc.add(new Paragraph("Total expenses: " + expenses.size(), bodyFont));
        doc.add(Chunk.NEWLINE);

        PdfPTable table = new PdfPTable(COLUMNS.length);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{3f, 1.4f, 1.1f, 1.5f, 1.7f, 1.3f, 1.6f, 1.7f, 1.4f, 2.8f});

        BaseColor headerColor = new BaseColor(83, 74, 183);
        for (String header : COLUMNS) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headFont));
            cell.setBackgroundColor(headerColor);
            cell.setPadding(6);
            table.addCell(cell);
        }

        boolean alt = false;
        for (Expense expense : expenses) {
            BaseColor rowColor = alt ? new BaseColor(245, 245, 252) : BaseColor.WHITE;
            alt = !alt;
            for (String value : exportRow(expense, userIdToName, groupIdToName)) {
                PdfPCell cell = new PdfPCell(new Phrase(value, bodyFont));
                cell.setBackgroundColor(rowColor);
                cell.setPadding(5);
                table.addCell(cell);
            }
        }

        doc.add(table);
        doc.close();
        return out.toByteArray();
    }

    public byte[] generateExcel(User user, List<Expense> expenses, Map<String, String> userIdToName, Map<String, String> groupIdToName) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Expenses");

            CellStyle headerStyle = wb.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.INDIGO.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setBorderBottom(BorderStyle.THIN);

            CellStyle altStyle = wb.createCellStyle();
            altStyle.setFillForegroundColor(IndexedColors.LAVENDER.getIndex());
            altStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Expense Report - " + safe(user.getName()));
            CellStyle titleStyle = wb.createCellStyle();
            Font titleFont = wb.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            Row metaRow = sheet.createRow(1);
            metaRow.createCell(0).setCellValue("Generated: " + FMT.format(Instant.now()) + " | Total: " + expenses.size() + " expenses");
            sheet.createRow(2);

            Row headerRow = sheet.createRow(3);
            headerRow.createCell(0).setCellValue("#");
            headerRow.getCell(0).setCellStyle(headerStyle);
            for (int i = 0; i < COLUMNS.length; i++) {
                Cell cell = headerRow.createCell(i + 1);
                cell.setCellValue(COLUMNS[i]);
                cell.setCellStyle(headerStyle);
            }

            for (int i = 0; i < expenses.size(); i++) {
                Row row = sheet.createRow(4 + i);
                if (i % 2 == 1) {
                    for (int j = 0; j <= COLUMNS.length; j++) {
                        row.createCell(j).setCellStyle(altStyle);
                    }
                }
                row.getCell(0, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK).setCellValue(i + 1);
                String[] values = exportRow(expenses.get(i), userIdToName, groupIdToName);
                for (int j = 0; j < values.length; j++) {
                    row.getCell(j + 1, Row.MissingCellPolicy.CREATE_NULL_AS_BLANK).setCellValue(values[j]);
                }
            }

            for (int i = 0; i <= COLUMNS.length; i++) {
                sheet.autoSizeColumn(i);
            }

            wb.write(out);
        }
        return out.toByteArray();
    }

    public byte[] generateWord(User user, List<Expense> expenses, Map<String, String> userIdToName, Map<String, String> groupIdToName) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try (XWPFDocument doc = new XWPFDocument()) {
            XWPFParagraph titlePara = doc.createParagraph();
            titlePara.setAlignment(ParagraphAlignment.CENTER);
            XWPFRun titleRun = titlePara.createRun();
            titleRun.setText("Expense Report");
            titleRun.setBold(true);
            titleRun.setFontSize(20);
            titleRun.setColor("534AB7");

            XWPFParagraph meta = doc.createParagraph();
            XWPFRun metaRun = meta.createRun();
            metaRun.setText("Name: " + safe(user.getName()) + " | Email: " + safe(user.getEmail()) + " | Date: " + FMT.format(Instant.now()));
            metaRun.setFontSize(10);
            metaRun.setColor("666666");

            doc.createParagraph();

            XWPFTable table = doc.createTable(expenses.size() + 1, COLUMNS.length);
            table.setWidth("100%");

            XWPFTableRow headerRow = table.getRow(0);
            for (int i = 0; i < COLUMNS.length; i++) {
                XWPFTableCell cell = headerRow.getCell(i);
                cell.setColor("534AB7");
                XWPFRun run = cell.getParagraphs().get(0).createRun();
                run.setText(COLUMNS[i]);
                run.setBold(true);
                run.setColor("FFFFFF");
                run.setFontSize(9);
            }

            for (int i = 0; i < expenses.size(); i++) {
                XWPFTableRow row = table.getRow(i + 1);
                String bg = (i % 2 == 0) ? "FFFFFF" : "F0EFFE";
                String[] values = exportRow(expenses.get(i), userIdToName, groupIdToName);
                for (int j = 0; j < values.length; j++) {
                    XWPFTableCell cell = row.getCell(j);
                    cell.setColor(bg);
                    XWPFRun run = cell.getParagraphs().get(0).createRun();
                    run.setText(values[j]);
                    run.setFontSize(8);
                }
            }

            doc.write(out);
        }
        return out.toByteArray();
    }

    private String[] exportRow(Expense expense, Map<String, String> userIdToName, Map<String, String> groupIdToName) {
        return new String[]{
            safe(expense.getDescription()),
            expense.getAmount() != null ? expense.getAmount().toPlainString() : "0",
            expense.getCurrency() != null ? expense.getCurrency() : "INR",
            safe(expense.getTag()),
            userName(expense.getPayerId(), userIdToName),
            expense.getType() != null ? expense.getType().name() : "-",
            expense.getCreatedAt() != null ? FMT.format(expense.getCreatedAt()) : "-",
            groupName(expense, groupIdToName),
            expense.getExpenseStatus() != null ? expense.getExpenseStatus().name() : "-",
            participants(expense, userIdToName)
        };
    }

    private String safe(String value) {
        return value != null && !value.isBlank() ? value : "-";
    }

    private String userName(String userId, Map<String, String> userIdToName) {
        return userIdToName.getOrDefault(userId, safe(userId));
    }

    private String groupName(Expense expense, Map<String, String> groupIdToName) {
        if (expense.getType() == null || expense.getType() != Expense.ExpenseType.GROUP) return "Personal";
        return groupIdToName.getOrDefault(expense.getGroupId(), safe(expense.getGroupId()));
    }

    private String participants(Expense expense, Map<String, String> userIdToName) {
        if (expense.getParticipantIds() == null || expense.getParticipantIds().isEmpty()) return "-";
        return expense.getParticipantIds().stream()
            .map(id -> userIdToName.getOrDefault(id, id))
            .collect(Collectors.joining(", "));
    }
}
