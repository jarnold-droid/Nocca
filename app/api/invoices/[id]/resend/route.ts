import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readStoredFile } from "@/lib/storage";
import { sendHandbillEmails } from "@/lib/email";

/** Re-sends the already-generated handbill without re-running extraction/PDF generation. Used from the invoice log to retry a failed send. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id }, include: { customer: true } });

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!invoice.pdfPath) {
    return NextResponse.json(
      { error: "No handbill has been generated for this invoice yet." },
      { status: 400 }
    );
  }

  const pdfBytes = await readStoredFile(invoice.pdfPath);
  const displayName = invoice.customer?.name ?? invoice.customerNameRaw ?? "Unknown";
  const pdfFilename = `handbill-${invoice.purchaseOrder || invoice.id}.pdf`;

  const sendResults = await sendHandbillEmails({
    format: invoice.format === "WHITE" ? "WHITE" : "YELLOW",
    customerName: displayName,
    purchaseOrder: invoice.purchaseOrder,
    pdfBytes,
    pdfFilename,
  });

  await prisma.emailLog.createMany({
    data: sendResults.map((r) => ({
      invoiceId: invoice.id,
      recipient: r.recipient,
      subject: r.subject,
      label: r.label,
      success: r.success,
      error: r.error ?? null,
    })),
  });

  const allSucceeded = sendResults.every((r) => r.success);
  const updated = await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status: allSucceeded ? "SENT" : "FAILED" },
    include: {
      customer: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      emailLogs: { orderBy: { sentAt: "desc" } },
    },
  });

  return NextResponse.json({ invoice: updated, sendResults });
}
