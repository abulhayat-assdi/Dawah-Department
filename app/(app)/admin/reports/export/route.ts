import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getMonthlyReport } from "@/lib/reports/monthly-data";
import { buildWordReport } from "@/lib/reports/word";
import { buildPdfReport } from "@/lib/reports/pdf";

// Node runtime: docx / @react-pdf need Node APIs (fs, Buffer).
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const month =
    searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const format = searchParams.get("format") === "pdf" ? "pdf" : "docx";

  const data = await getMonthlyReport(month);

  if (format === "pdf") {
    const buf = await buildPdfReport(data);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ADIMS-report-${month}.pdf"`,
      },
    });
  }

  const buf = await buildWordReport(data);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="ADIMS-report-${month}.docx"`,
    },
  });
}
