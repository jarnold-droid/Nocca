import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readStoredFile } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice || !invoice.pdfPath) {
    return NextResponse.json({ error: "PDF not generated yet" }, { status: 404 });
  }

  const bytes = await readStoredFile(invoice.pdfPath);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="handbill-${invoice.purchaseOrder || invoice.id}.pdf"`,
    },
  });
}
