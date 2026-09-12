import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { matchCustomers } from "@/lib/fuzzyMatch";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name") ?? "";

  const customers = await prisma.customer.findMany();
  const matches = matchCustomers(
    name,
    customers.map((c) => ({ id: c.id, name: c.name, accountNumber: c.accountNumber }))
  );

  return NextResponse.json({ matches });
}
