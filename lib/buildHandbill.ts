import { prisma } from "@/lib/prisma";
import { generateHandbillPdf, type HandbillLineItem } from "@/lib/handbillPdf";

interface RawLineItem {
  quantity?: unknown;
  description?: unknown;
}

export interface HandbillRequestBody {
  format?: unknown;
  customerId?: unknown;
  customerName?: unknown;
  purchaseOrder?: unknown;
  deliveryDate?: unknown;
  lineItems?: unknown;
}

export interface ParsedHandbillRequest {
  format: "YELLOW" | "WHITE";
  customerName: string;
  purchaseOrder: string;
  deliveryDate: string;
  lineItems: HandbillLineItem[];
}

export class HandbillRequestError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Shared parsing/validation used by both /api/preview and /api/send. */
async function parseHandbillRequest(
  body: HandbillRequestBody
): Promise<{ parsed: ParsedHandbillRequest; accountNumber: string }> {
  const format = body.format === "WHITE" ? "WHITE" : "YELLOW";
  const customerId = typeof body.customerId === "string" && body.customerId ? body.customerId : null;
  const customerName = String(body.customerName ?? "").trim();
  const purchaseOrder = String(body.purchaseOrder ?? "").trim();
  const deliveryDate = String(body.deliveryDate ?? "").trim();
  const rawLineItems: RawLineItem[] = Array.isArray(body.lineItems) ? body.lineItems : [];

  if (!customerName || !purchaseOrder) {
    throw new HandbillRequestError("Customer name and purchase order are required.");
  }

  let accountNumber = "";
  if (customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new HandbillRequestError("Selected customer no longer exists.");
    }
    accountNumber = customer.accountNumber;
  }

  const lineItems = rawLineItems
    .map((item) => ({
      quantity: String(item.quantity ?? "").trim(),
      description: String(item.description ?? "").trim(),
    }))
    .filter((item) => item.description.length > 0);

  return { parsed: { format, customerName, purchaseOrder, deliveryDate, lineItems }, accountNumber };
}

export async function buildHandbillPdfFromBody(
  body: HandbillRequestBody
): Promise<{ parsed: ParsedHandbillRequest; pdfBytes: Uint8Array }> {
  const { parsed, accountNumber } = await parseHandbillRequest(body);
  const pdfBytes = await generateHandbillPdf({
    customerName: parsed.customerName,
    accountNumber,
    deliveryDate: parsed.deliveryDate,
    purchaseOrder: parsed.purchaseOrder,
    lineItems: parsed.lineItems,
  });
  return { parsed, pdfBytes };
}
