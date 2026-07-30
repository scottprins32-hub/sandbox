import { NextRequest, NextResponse } from "next/server";
import { getCurrentOrg } from "@/server/org";
import { payrollCsv, payrollForMonth } from "@/server/payrollService";
import { currentMonthKey } from "@/lib/dates";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("month") ?? "";
  const month = /^\d{4}-\d{2}$/.test(raw) ? raw : currentMonthKey();
  const org = await getCurrentOrg();
  const rows = await payrollForMonth(org.id, month);
  return new NextResponse(payrollCsv(rows, month), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="scara-payroll-${month}.csv"`,
    },
  });
}
