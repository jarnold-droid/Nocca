import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractInvoiceFromImage, type InvoiceFormat } from "@/lib/extractInvoice";
import { matchCustomers } from "@/lib/fuzzyMatch";

// Stateless: the photo is used once for the vision call and then discarded —
// nothing about the invoice is persisted anywhere.
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

  let extraction;
  try {
    extraction = await extractInvoiceFromImage(bytes, mimeType, orientationGuess);
  } catch (err) {
    return NextResponse.json(
      { error: `Extraction failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  const customers = await prisma.customer.findMany();
  const matches = matchCustomers(
    extraction.customerName,
    customers.map((c) => ({ id: c.id, name: c.name, accountNumber: c.accountNumber }))
  );

  return NextResponse.json({ extraction, matches });
}
