import sgMail from "@sendgrid/mail";

export interface SendResult {
  recipient: string;
  label: string;
  subject: string;
  success: boolean;
  error?: string;
}

interface SendHandbillArgs {
  format: "YELLOW" | "WHITE";
  customerName: string;
  purchaseOrder: string;
  pdfBytes: Uint8Array;
  pdfFilename: string;
}

/** SendGrid's client throws a generic "Forbidden"/"Bad Request" message; the actionable
 * detail (e.g. "does not match a verified Sender Identity") is nested in the response body. */
function describeSendGridError(err: unknown): string {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "body" in err.response
  ) {
    const body = (err.response as { body?: unknown }).body;
    if (body && typeof body === "object" && "errors" in body && Array.isArray(body.errors)) {
      const messages = body.errors
        .map((e) => (e && typeof e === "object" && "message" in e ? String(e.message) : null))
        .filter((m): m is string => Boolean(m));
      if (messages.length > 0) return messages.join("; ");
    }
  }
  return err instanceof Error ? err.message : String(err);
}

/**
 * Sends the handbill to the office, and additionally to the second contact when the
 * invoice is tagged YELLOW. Each recipient is a separate send so one failing (e.g. a bad
 * address) doesn't prevent the other from going out.
 */
export async function sendHandbillEmails(args: SendHandbillArgs): Promise<SendResult[]> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM;
  const officeEmail = process.env.OFFICE_EMAIL;
  const secondContactEmail = process.env.SECOND_CONTACT_EMAIL;

  if (!apiKey || !from || !officeEmail || !secondContactEmail) {
    throw new Error(
      "SENDGRID_API_KEY / EMAIL_FROM / OFFICE_EMAIL / SECOND_CONTACT_EMAIL are not configured"
    );
  }
  sgMail.setApiKey(apiKey);

  const recipients: { email: string; label: string }[] = [{ email: officeEmail, label: "Office Copy" }];
  if (args.format === "YELLOW") {
    recipients.push({ email: secondContactEmail, label: "Second Contact Copy" });
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
        error: describeSendGridError(err),
      });
    }
  }

  return results;
}
