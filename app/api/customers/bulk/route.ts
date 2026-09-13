import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface BulkCustomer {
  name?: unknown;
  accountNumber?: unknown;
}

export async function POST(request: Request) {
  const body = await request.json();
  const rows: BulkCustomer[] = Array.isArray(body.customers) ? body.customers : [];

  const valid: { name: string; accountNumber: string }[] = [];
  const skipped: string[] = [];

  for (const row of rows) {
    const name = String(row.name ?? "").trim();
    const accountNumber = String(row.accountNumber ?? "").trim();
    if (name && accountNumber) {
      valid.push({ name, accountNumber });
    } else {
      skipped.push(JSON.stringify(row));
    }
  }

  if (valid.length > 0) {
    await prisma.customer.createMany({ data: valid });
  }

  return NextResponse.json({ created: valid.length, skipped });
}
