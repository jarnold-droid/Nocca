import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readStoredFile } from "@/lib/storage";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const bytes = await readStoredFile(invoice.photoPath);
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": invoice.photoMimeType,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
