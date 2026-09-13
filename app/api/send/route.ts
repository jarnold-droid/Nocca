import { NextResponse } from "next/server";
import { buildHandbillPdfFromBody, HandbillRequestError } from "@/lib/buildHandbill";
import { sendHandbillEmails } from "@/lib/email";

// Stateless: generates the handbill PDF in memory and emails it directly.
// Nothing is written to a database or disk — once a handbill is sent, it's sent.
// The PDF is also returned (base64) so the confirmation screen can show what was sent.
export async function POST(request: Request) {
  const body = await request.json();

  try {
    const { parsed, pdfBytes } = await buildHandbillPdfFromBody(body);

    const sendResults = await sendHandbillEmails({
      format: parsed.format,
      customerName: parsed.customerName,
      purchaseOrder: parsed.purchaseOrder,
      pdfBytes,
      pdfFilename: `handbill-${parsed.purchaseOrder}.pdf`,
    });

    return NextResponse.json({ sendResults, pdfBase64: Buffer.from(pdfBytes).toString("base64") });
  } catch (err) {
    const status = err instanceof HandbillRequestError ? err.status : 500;
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to generate/send handbill: ${message}` }, { status });
  }
}
