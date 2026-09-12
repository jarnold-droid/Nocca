import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { savePhoto } from "@/lib/storage";
import { extractInvoiceFromImage, type InvoiceFormat } from "@/lib/extractInvoice";
import { matchCustomers } from "@/lib/fuzzyMatch";

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("photo");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing photo file" }, { status: 400 });
  }

  const width = Number(formData.get("width") ?? 0);
  const height = Number(formData.get("height") ?? 0);
  const formatOverride = formData.get("format");

  const orientationGuess: InvoiceFormat =
    formatOverride === "YELLOW" || formatOverride === "WHITE"
      ? formatOverride
      : width > height
        ? "YELLOW" // landscape
        : "WHITE"; // portrait

  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "image/jpeg";
  const extension = EXTENSION_BY_MIME[mimeType] ?? "jpg";

  // Run extraction before persisting anything, so a failed call doesn't leave an orphaned
  // photo file / invoice row with no data behind it.
  let extraction;
  try {
    extraction = await extractInvoiceFromImage(bytes, mimeType, orientationGuess);
  } catch (err) {
    return NextResponse.json(
      { error: `Extraction failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  const photoPath = await savePhoto(bytes, extension);

  const invoice = await prisma.invoice.create({
    data: {
      status: "PENDING_REVIEW",
      format: extraction.format,
      photoPath,
      photoMimeType: mimeType,
      rawExtraction: JSON.stringify(extraction),
      customerNameRaw: extraction.customerName,
      customerNameNeedsReview: extraction.customerNameNeedsReview,
      purchaseOrder: extraction.purchaseOrder,
      purchaseOrderNeedsReview: extraction.purchaseOrderNeedsReview,
      deliveryDate: extraction.deliveryDate,
      lineItems: {
        create: extraction.lineItems.map((item, index) => ({
          quantity: item.quantity,
          description: item.description,
          sortOrder: index,
        })),
      },
    },
    include: { lineItems: true },
  });

  const customers = await prisma.customer.findMany();
  const matches = matchCustomers(
    extraction.customerName,
    customers.map((c) => ({ id: c.id, name: c.name, accountNumber: c.accountNumber }))
  );

  return NextResponse.json({ invoice, extraction, matches });
}
