import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  WidthType,
  AlignmentType,
} from "docx";
import type { MonthlyReport, YearlyReport } from "./monthly-data";

function cell(text: string, bold = false): TableCell {
  return new TableCell({
    children: [
      new Paragraph({ children: [new TextRun({ text, bold })] }),
    ],
  });
}

function table(head: string[], rows: string[][]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ children: head.map((h) => cell(h, true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((c) => cell(c)) })),
    ],
  });
}

/** Build the monthly report as a .docx Buffer. Word shapes Bangla natively. */
export async function buildWordReport(data: MonthlyReport): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "ADIMS — Dawah Department", bold: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Monthly Report — ${data.monthLabel}`,
                size: 26,
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Generated: ${data.generatedAt}`,
                italics: true,
                size: 18,
              }),
            ],
          }),
          new Paragraph({ text: "" }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "Teacher Performance", bold: true })],
          }),
          table(
            ["Member", "Days Reported", "Work Hours", "Counseling", "Classes Taken", "Batches Managed"],
            data.members.map((m) => [
              m.name,
              String(m.days_reported),
              String(m.total_hours),
              String(m.total_counseling),
              String(m.classes_taken),
              m.batches.join(", ") || "—",
            ]),
          ),
          new Paragraph({
            children: [
              new TextRun({
                text: `Totals — Reports: ${data.totals.reports}, Hours: ${data.totals.hours}, Counseling: ${data.totals.counseling}`,
                bold: true,
              }),
            ],
          }),
          new Paragraph({ text: "" }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "Course Progress", bold: true })],
          }),
          table(
            ["Course", "Campus", "Batch", "Completed/Total", "Progress", "Status"],
            data.tracker.map((t) => [
              t.course_info,
              t.campus_name ?? "—",
              t.batch_no,
              `${t.completed_classes}/${t.total_classes}`,
              `${t.progress_pct}%`,
              t.status,
            ]),
          ),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc) as unknown as Promise<Buffer>;
}

/** Build the yearly tracker as a .docx Buffer. */
export async function buildYearlyWordReport(data: YearlyReport): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "ADIMS — Dawah Department", bold: true }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: `Yearly Tracker — ${data.year}`, size: 26 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Generated: ${data.generatedAt}`,
                italics: true,
                size: 18,
              }),
            ],
          }),
          new Paragraph({ text: "" }),

          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: "Month-by-Month Overview", bold: true })],
          }),
          table(
            ["Month", "Reports", "Hours", "Counseling", "Classes Taken"],
            data.monthly.map((m) => [
              m.monthLabel,
              String(m.reports),
              String(m.hours),
              String(m.counseling),
              String(m.classes),
            ]),
          ),
          new Paragraph({
            children: [
              new TextRun({
                text: `Yearly Totals — Reports: ${data.totals.reports}, Hours: ${data.totals.hours}, Counseling: ${data.totals.counseling}, Classes Taken: ${data.totals.classes}`,
                bold: true,
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc) as unknown as Promise<Buffer>;
}
