import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateHandbillPdf } from "@/lib/handbillPdf";
import { sendHandbillEmails } from "@/lib/email";

interface SendLineItem {
  quantity?: unknown;
  description?: unknown;
}

// Stateless: generates the handbill PDF in memory and emails it directly.
// Nothing is written to a database or disk — once a handbill is sent, it's sent.
export async function POST(request: Request) {
  const body = await request.json();

  const format = body.format === "WHITE" ? "WHITE" : "YELLOW";
  const customerId: string | null = body.customerId || null;
  const customerName = String(body.customerName ?? "").trim();
  const purchaseOrder = String(body.purchaseOrder ?? "").trim();
  const deliveryDate = String(body.deliveryDate ?? "").trim();
  const lineItems: SendLineItem[] = Array.isArray(body.lineItems) ? body.lineItems : [];

  if (!customerName || !purchaseOrder) {
    return NextResponse.json(
      { error: "Customer name and purchase order are required to send." },
      { status: 400 }
    );
  }

  let accountNumber = "";
  if (customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return NextResponse.json({ error: "Selected customer no longer exists" }, { status: 400 });
    }
    accountNumber = customer.accountNumber;
  }

  try {
    const pdfBytes = await generateHandbillPdf({
      customerName,
      accountNumber,
      deliveryDate,
      purchaseOrder,
      lineItems: lineItems
        .map((item) => ({
          quantity: String(item.quantity ?? "").trim(),
          description: String(item.description ?? "").trim(),
        }))
        .filter((item) => item.description.length > 0),
    });

    const sendResults = await sendHandbillEmails({
      format,
      customerName,
      purchaseOrder,
      pdfBytes,
      pdfFilename: `handbill-${purchaseOrder}.pdf`,
    });

    return NextResponse.json({ sendResults });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to generate/send handbill: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
