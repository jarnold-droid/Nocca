import { NextResponse } from "next/server";
import { buildHandbillPdfFromBody, HandbillRequestError } from "@/lib/buildHandbill";

/** Generates the handbill PDF from the current review-screen fields without sending anything —
 * lets the user see exactly what will go out before they commit to Confirm & Send. */
export async function POST(request: Request) {
  const body = await request.json();

  try {
    const { pdfBytes } = await buildHandbillPdfFromBody(body);
    return new NextResponse(new Uint8Array(pdfBytes), {
      headers: { "Content-Type": "application/pdf" },
    });
  } catch (err) {
    const status = err instanceof HandbillRequestError ? err.status : 500;
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to generate preview: ${message}` }, { status });
  }
}
