import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getYearlyReport } from "@/lib/reports/monthly-data";
import { buildYearlyWordReport } from "@/lib/reports/word";
import { buildYearlyPdfReport } from "@/lib/reports/pdf";

// Node runtime: docx / @react-pdf need Node APIs (fs, Buffer).
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireAdmin();

  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year") || String(new Date().getFullYear());
  const format = searchParams.get("format") === "pdf" ? "pdf" : "docx";

  const data = await getYearlyReport(year);

  if (format === "pdf") {
    const buf = await buildYearlyPdfReport(data);
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ADIMS-yearly-${year}.pdf"`,
      },
    });
  }

  const buf = await buildYearlyWordReport(data);
  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="ADIMS-yearly-${year}.docx"`,
    },
  });
}
