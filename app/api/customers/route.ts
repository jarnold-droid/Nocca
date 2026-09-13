import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json({ customers });
}

export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();
  const accountNumber = String(body.accountNumber ?? "").trim();

  if (!name || !accountNumber) {
    return NextResponse.json({ error: "name and accountNumber are required" }, { status: 400 });
  }

  const customer = await prisma.customer.create({ data: { name, accountNumber } });
  return NextResponse.json({ customer }, { status: 201 });
}
