import sgMail from "@sendgrid/mail";
import { prisma } from "./prisma";

export interface SendResult {
  recipient: string;
  label: string;
  subject: string;
  success: boolean;
  error?: string;
}

/** Settings row is a singleton (id=1), seeded from env vars on first read. */
export async function getSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (existing) return existing;

  return prisma.settings.create({
    data: {
      id: 1,
      officeEmail: process.env.OFFICE_EMAIL || "jtcappiello@gmail.com",
      secondContactEmail: process.env.SECOND_CONTACT_EMAIL || "jtcappiello@gmail.com",
    },
  });
}

export async function updateSettings(officeEmail: string, secondContactEmail: string) {
  return prisma.settings.upsert({
    where: { id: 1 },
    update: { officeEmail, secondContactEmail },
    create: { id: 1, officeEmail, secondContactEmail },
  });
}

interface SendHandbillArgs {
  format: "YELLOW" | "WHITE";
  customerName: string;
  purchaseOrder: string;
  pdfBytes: Uint8Array;
  pdfFilename: string;
}

/**
 * Sends the handbill to the office, and additionally to the second contact when the
 * invoice is tagged YELLOW. Each recipient is a separate send so one failing (e.g. a bad
 * address) doesn't prevent the other from going out, and each attempt is logged individually.
 */
export async function sendHandbillEmails(args: SendHandbillArgs): Promise<SendResult[]> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("SENDGRID_API_KEY / EMAIL_FROM are not configured");
  }
  sgMail.setApiKey(apiKey);

  const settings = await getSettings();
  const recipients: { email: string; label: string }[] = [
    { email: settings.officeEmail, label: "Office Copy" },
  ];
  if (args.format === "YELLOW") {
    recipients.push({ email: settings.secondContactEmail, label: "Second Contact Copy" });
  }

  const results: SendResult[] = [];
  for (const recipient of recipients) {
    const subject = `Handbill — ${recipient.label} — ${args.customerName} — PO ${args.purchaseOrder}`;
    const body = [
      `Handbill attached for ${args.customerName} (PO# ${args.purchaseOrder}).`,
      `Copy type: ${recipient.label} (source invoice tagged ${args.format}).`,
    ].join("\n");

    try {
      await sgMail.send({
        to: recipient.email,
        from,
        subject,
        text: body,
        attachments: [
          {
            content: Buffer.from(args.pdfBytes).toString("base64"),
            filename: args.pdfFilename,
            type: "application/pdf",
            disposition: "attachment",
          },
        ],
      });
      results.push({ recipient: recipient.email, label: recipient.label, subject, success: true });
    } catch (err) {
      results.push({
        recipient: recipient.email,
        label: recipient.label,
        subject,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return results;
}
