import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateHandbillPdf } from "@/lib/handbillPdf";
import { savePdf } from "@/lib/storage";
import { sendHandbillEmails } from "@/lib/email";

interface ConfirmLineItem {
  quantity?: unknown;
  description?: unknown;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();

  const format = body.format === "WHITE" ? "WHITE" : "YELLOW";
  const customerId: string | null = body.customerId || null;
  const customerName = String(body.customerName ?? "").trim();
  const purchaseOrder = String(body.purchaseOrder ?? "").trim();
  const deliveryDate = String(body.deliveryDate ?? "").trim();
  const lineItems: ConfirmLineItem[] = Array.isArray(body.lineItems) ? body.lineItems : [];

  if (!customerName || !purchaseOrder) {
    return NextResponse.json(
      { error: "Customer name and purchase order are required to confirm." },
      { status: 400 }
    );
  }

  let customer = null;
  if (customerId) {
    customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json({ error: "Selected customer no longer exists" }, { status: 400 });
    }
  }

  await prisma.invoiceLineItem.deleteMany({ where: { invoiceId: id } });
  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      format,
      customerId,
      customerNameRaw: customerName,
      customerNameNeedsReview: false,
      purchaseOrder,
      purchaseOrderNeedsReview: false,
      deliveryDate,
      lineItems: {
        create: lineItems.map((item, index) => ({
          quantity: String(item.quantity ?? "").trim(),
          description: String(item.description ?? "").trim(),
          sortOrder: index,
        })),
      },
    },
    include: { lineItems: { orderBy: { sortOrder: "asc" } }, customer: true },
  });

  const displayName = invoice.customer?.name ?? invoice.customerNameRaw ?? customerName;
  const accountNumber = invoice.customer?.accountNumber ?? "";

  try {
    const pdfBytes = await generateHandbillPdf({
      customerName: displayName,
      accountNumber,
      deliveryDate: invoice.deliveryDate,
      purchaseOrder: invoice.purchaseOrder,
      lineItems: invoice.lineItems.map((item) => ({
        quantity: item.quantity,
        description: item.description,
      })),
    });

    const pdfPath = await savePdf(pdfBytes, invoice.id);
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
      data: { pdfPath, status: allSucceeded ? "SENT" : "FAILED" },
      include: {
        customer: true,
        lineItems: { orderBy: { sortOrder: "asc" } },
        emailLogs: { orderBy: { sentAt: "desc" } },
      },
    });

    return NextResponse.json({ invoice: updated, sendResults });
  } catch (err) {
    await prisma.invoice.update({ where: { id: invoice.id }, data: { status: "FAILED" } });
    return NextResponse.json(
      { error: `Failed to generate/send handbill: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
