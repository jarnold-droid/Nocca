import Anthropic from "@anthropic-ai/sdk";

export type InvoiceFormat = "YELLOW" | "WHITE";

export interface ExtractedLineItem {
  quantity: string;
  description: string;
}

export interface ExtractedInvoice {
  format: InvoiceFormat;
  customerName: string;
  customerNameNeedsReview: boolean;
  purchaseOrder: string;
  purchaseOrderNeedsReview: boolean;
  deliveryDate: string;
  lineItems: ExtractedLineItem[];
  notes: string;
}

const MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `You read photos of purchase-order invoices from a food distributor and pull out a fixed set of fields for a downstream "handbill" form. There are two known invoice formats:

FORMAT A - "YELLOW copy" (landscape orientation):
- Customer PO# and Customer Name are HANDWRITTEN, appearing as loose highlighted/circled text below the main item table (not in a labeled field).
- Ship date is printed in the header table, labeled "SHP DATE".
- Quantity shipped is in a column labeled "QTY SHP".
- Item description is in a column labeled "STOCK CODE DESCRIPTION".

FORMAT B - "WHITE copy" (portrait orientation):
- PO# is printed, top-right of the page, labeled "PO#:".
- Customer Name is printed, top-right of the page.
- Ship/delivery date is printed, top-left, labeled "Delv Date:".
- Quantity shipped is in a column labeled "SHIP" (under "QUANTITY").
- Item description is in a column labeled "DESCRIPTION".

Extract exactly these 5 fields: Customer PO#, Customer Name, Ship/Delivery Date, and Quantity Shipped + Item Description for every line item on the invoice (there may be more than one).

Customer PO# and Customer Name are sometimes HANDWRITTEN (this only happens on the YELLOW format). Set the "NeedsReview" flag to true for either field whenever it is handwritten, unclear, smudged, or you are otherwise not highly confident in the reading — err toward flagging for review rather than guessing silently.

Respond with ONLY a single JSON object, no prose, no markdown fences, matching exactly this shape:
{
  "format": "YELLOW" | "WHITE",
  "customerName": string,
  "customerNameNeedsReview": boolean,
  "purchaseOrder": string,
  "purchaseOrderNeedsReview": boolean,
  "deliveryDate": string,
  "lineItems": [{ "quantity": string, "description": string }, ...],
  "notes": string
}
"notes" should be a short (<200 char) note about anything ambiguous, or an empty string.`;

function buildUserPrompt(orientationGuess: InvoiceFormat) {
  return `The photo's aspect ratio suggests this is most likely the ${orientationGuess} copy format, based on landscape (YELLOW) vs. portrait (WHITE) orientation. Confirm or override that guess from the actual content and labels visible in the image, then extract the fields as instructed.`;
}

export async function extractInvoiceFromImage(
  imageBytes: Buffer,
  mimeType: string,
  orientationGuess: InvoiceFormat
): Promise<ExtractedInvoice> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/webp",
              data: imageBytes.toString("base64"),
            },
          },
          {
            type: "text",
            text: buildUserPrompt(orientationGuess),
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from vision model");
  }

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Vision model response did not contain JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    format: parsed.format === "WHITE" ? "WHITE" : "YELLOW",
    customerName: String(parsed.customerName ?? "").trim(),
    customerNameNeedsReview: Boolean(parsed.customerNameNeedsReview),
    purchaseOrder: String(parsed.purchaseOrder ?? "").trim(),
    purchaseOrderNeedsReview: Boolean(parsed.purchaseOrderNeedsReview),
    deliveryDate: String(parsed.deliveryDate ?? "").trim(),
    lineItems: Array.isArray(parsed.lineItems)
      ? parsed.lineItems.map((item: { quantity?: unknown; description?: unknown }) => ({
          quantity: String(item.quantity ?? "").trim(),
          description: String(item.description ?? "").trim(),
        }))
      : [],
    notes: String(parsed.notes ?? ""),
  };
}
