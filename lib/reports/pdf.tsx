import path from "node:path";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { MonthlyReport } from "./monthly-data";

// Register the bundled Noto Sans Bengali so Bangla glyphs render in the PDF.
// (The default Helvetica has no Bengali coverage.)
let fontsReady = false;
function ensureFonts() {
  if (fontsReady) return;
  const dir = path.join(process.cwd(), "lib", "reports", "fonts");
  Font.register({
    family: "NotoBengali",
    fonts: [
      { src: path.join(dir, "NotoSansBengali-Regular.ttf") },
      { src: path.join(dir, "NotoSansBengali-Bold.ttf"), fontWeight: "bold" },
    ],
  });
  fontsReady = true;
}

const s = StyleSheet.create({
  page: { padding: 32, fontFamily: "NotoBengali", fontSize: 9, color: "#1e293b" },
  h1: { fontSize: 16, fontWeight: "bold", textAlign: "center" },
  h2: { fontSize: 12, fontWeight: "bold", marginTop: 16, marginBottom: 6 },
  sub: { fontSize: 10, textAlign: "center", marginTop: 2 },
  meta: { fontSize: 8, textAlign: "center", color: "#64748b", marginTop: 2 },
  row: { flexDirection: "row", borderBottom: "1px solid #e2e8f0" },
  headRow: { flexDirection: "row", backgroundColor: "#f1f5f9" },
  cell: { padding: 4, flex: 1 },
  cellBold: { padding: 4, flex: 1, fontWeight: "bold" },
  totals: { marginTop: 6, fontWeight: "bold" },
});

function Cell({ children, head = false }: { children: React.ReactNode; head?: boolean }) {
  return <Text style={head ? s.cellBold : s.cell}>{children}</Text>;
}

function ReportDoc({ data }: { data: MonthlyReport }) {
  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.h1}>ADIMS — Dawah Department</Text>
        <Text style={s.sub}>Monthly Report — {data.monthLabel}</Text>
        <Text style={s.meta}>Generated: {data.generatedAt}</Text>

        <Text style={s.h2}>Member Activity</Text>
        <View style={s.headRow}>
          <Cell head>Member</Cell>
          <Cell head>Days</Cell>
          <Cell head>Hours</Cell>
          <Cell head>Counseling</Cell>
        </View>
        {data.members.map((m) => (
          <View style={s.row} key={m.teacher_id}>
            <Cell>{m.name}</Cell>
            <Cell>{m.days_reported}</Cell>
            <Cell>{m.total_hours}</Cell>
            <Cell>{m.total_counseling}</Cell>
          </View>
        ))}
        <Text style={s.totals}>
          Totals — Reports: {data.totals.reports}, Hours: {data.totals.hours},
          Counseling: {data.totals.counseling}
        </Text>

        <Text style={s.h2}>Course Progress</Text>
        <View style={s.headRow}>
          <Cell head>Course</Cell>
          <Cell head>Campus</Cell>
          <Cell head>Batch</Cell>
          <Cell head>Done/Total</Cell>
          <Cell head>Progress</Cell>
          <Cell head>Status</Cell>
        </View>
        {data.tracker.map((t) => (
          <View style={s.row} key={t.batch_id}>
            <Cell>{t.course_info}</Cell>
            <Cell>{t.campus_name ?? "—"}</Cell>
            <Cell>{t.batch_no}</Cell>
            <Cell>
              {t.completed_classes}/{t.total_classes}
            </Cell>
            <Cell>{t.progress_pct}%</Cell>
            <Cell>{t.status}</Cell>
          </View>
        ))}
      </Page>
    </Document>
  );
}

/** Build the monthly report as a PDF Buffer. */
export async function buildPdfReport(data: MonthlyReport): Promise<Buffer> {
  ensureFonts();
  return renderToBuffer(<ReportDoc data={data} />);
}
