import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/email";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  const body = await request.json();
  const officeEmail = String(body.officeEmail ?? "").trim();
  const secondContactEmail = String(body.secondContactEmail ?? "").trim();

  if (!officeEmail || !secondContactEmail) {
    return NextResponse.json(
      { error: "officeEmail and secondContactEmail are required" },
      { status: 400 }
    );
  }

  const settings = await updateSettings(officeEmail, secondContactEmail);
  return NextResponse.json({ settings });
}
