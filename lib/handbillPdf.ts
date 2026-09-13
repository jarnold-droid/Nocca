import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";

const TEMPLATE_PATH = path.resolve("assets/handbill-template.pdf");
const PAGE_HEIGHT = 792; // US Letter, points

// Coordinates below were measured directly off assets/handbill-template.pdf
// (a flat, non-fillable PDF) using PyMuPDF word/line extraction. They are
// expressed top-down (distance from the top of the page, matching how the
// template's own text runs top-to-bottom) and converted to pdf-lib's
// bottom-up coordinate space with `topDown()` at draw time.
function topDown(y: number) {
  return PAGE_HEIGHT - y;
}

const HEADER_FIELDS = {
  customerName: { x: 160, yTop: 163.5, size: 10 },
  acctNumber: { x: 430, yTop: 163.5, size: 10 },
  deliveryDate: { x: 165, yTop: 201.5, size: 10 },
  purchaseOrder: { x: 400, yTop: 201.5, size: 10 },
};

// Horizontal gridlines of the item table, top to bottom. The first gap
// (index 0 -> 1) is the header row; every gap after that is one data row.
const TABLE_ROW_LINES = [
  269.8, 298.2, 316.2, 334.3, 352.3, 370.4, 388.4, 406.4, 424.6, 442.6, 460.7, 478.7, 496.8,
];
export const HANDBILL_ROWS_PER_PAGE = TABLE_ROW_LINES.length - 2; // 11

const COLUMNS = {
  qty: { x0: 117.2, x1: 152.8 },
  description: { x0: 153.2 + 6, x1: 409.3 - 4 },
};

// Blank line after "CUSTOMER SIGNATURE" on the template.
const SIGNATURE_LINE = { x0: 182, x1: 340, yTop: 542 };

/**
 * Draws a generic loopy pen-stroke mark on the signature line — not a captured signature,
 * just a mark so the handbill doesn't go out with an obviously blank line. Built from
 * randomized, tilted cursive-style loops (via SVG elliptical arcs) with entry/exit flourish
 * strokes, so it reads as an actual signature rather than a wavy line, and no two handbills
 * carry the exact same stamped-looking mark.
 */
function drawSignatureScribble(page: PDFPage, x: number, yTop: number) {
  const jitter = (range: number) => (Math.random() - 0.5) * range;

  let path = `M0,0 c4,-3 8,-4 12,${(-2 + jitter(3)).toFixed(1)}`;

  const loopCount = 4 + Math.round(Math.random());
  for (let i = 0; i < loopCount; i++) {
    const rx = 4 + Math.random() * 2.5;
    const ry = 8 + Math.random() * 6;
    const rotation = -15 + jitter(30);
    const hopX = 7 + Math.random() * 5;
    const hopY = jitter(8);
    path += ` a${rx.toFixed(1)},${ry.toFixed(1)} ${rotation.toFixed(0)} 1 1 ${jitter(2).toFixed(1)},${(-ry * 2).toFixed(1)}`;
    path += ` a${rx.toFixed(1)},${ry.toFixed(1)} ${rotation.toFixed(0)} 1 1 ${jitter(2).toFixed(1)},${(ry * 2).toFixed(1)}`;
    path += ` c2,${(-2 + jitter(4)).toFixed(1)} ${(hopX * 0.6).toFixed(1)},${(hopY * 0.5 - 3).toFixed(1)} ${hopX.toFixed(1)},${hopY.toFixed(1)}`;
  }

  path += ` c6,2 12,-6 18,${jitter(4).toFixed(1)}`; // exit flourish

  page.drawSvgPath(path, {
    x,
    y: topDown(yTop),
    borderColor: rgb(0.15, 0.15, 0.45),
    borderWidth: 1.1,
  });
}

export interface HandbillLineItem {
  quantity: string;
  description: string;
}

export interface HandbillData {
  customerName: string;
  accountNumber: string;
  deliveryDate: string;
  purchaseOrder: string;
  lineItems: HandbillLineItem[];
}

/** Shrinks font size as needed so `text` fits within `maxWidth`, down to a floor of 6pt, then truncates with an ellipsis as a last resort. */
function fitText(font: PDFFont, text: string, maxWidth: number, startSize: number) {
  let size = startSize;
  while (size > 6 && font.widthOfTextAtSize(text, size) > maxWidth) {
    size -= 0.5;
  }
  if (font.widthOfTextAtSize(text, size) <= maxWidth) {
    return { text, size };
  }
  let truncated = text;
  while (truncated.length > 1 && font.widthOfTextAtSize(`${truncated}…`, size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return { text: `${truncated}…`, size };
}

export async function generateHandbillPdf(data: HandbillData): Promise<Uint8Array> {
  const templateBytes = await readFile(TEMPLATE_PATH);
  const templateDoc = await PDFDocument.load(templateBytes);

  const outDoc = await PDFDocument.create();
  const font = await outDoc.embedFont(StandardFonts.Helvetica);

  const lineItems = data.lineItems.length > 0 ? data.lineItems : [{ quantity: "", description: "" }];
  const pageCount = Math.max(1, Math.ceil(lineItems.length / HANDBILL_ROWS_PER_PAGE));
  const templatePages = await outDoc.copyPages(templateDoc, new Array(pageCount).fill(0));

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    const page = templatePages[pageIndex];
    outDoc.addPage(page);

    const draw = (text: string, x: number, yTop: number, size: number) => {
      if (!text) return;
      page.drawText(text, { x, y: topDown(yTop), size, font });
    };

    draw(data.customerName, HEADER_FIELDS.customerName.x, HEADER_FIELDS.customerName.yTop, HEADER_FIELDS.customerName.size);
    draw(data.accountNumber, HEADER_FIELDS.acctNumber.x, HEADER_FIELDS.acctNumber.yTop, HEADER_FIELDS.acctNumber.size);
    draw(data.deliveryDate, HEADER_FIELDS.deliveryDate.x, HEADER_FIELDS.deliveryDate.yTop, HEADER_FIELDS.deliveryDate.size);
    draw(data.purchaseOrder, HEADER_FIELDS.purchaseOrder.x, HEADER_FIELDS.purchaseOrder.yTop, HEADER_FIELDS.purchaseOrder.size);
    drawSignatureScribble(page, SIGNATURE_LINE.x0, SIGNATURE_LINE.yTop);

    const pageItems = lineItems.slice(pageIndex * HANDBILL_ROWS_PER_PAGE, (pageIndex + 1) * HANDBILL_ROWS_PER_PAGE);
    pageItems.forEach((item, rowIndex) => {
      const rowTop = TABLE_ROW_LINES[rowIndex + 1];
      const rowBottom = TABLE_ROW_LINES[rowIndex + 2];
      const baselineYTop = (rowTop + rowBottom) / 2 + 2.5;

      const qty = fitText(font, item.quantity, COLUMNS.qty.x1 - COLUMNS.qty.x0 - 4, 9);
      page.drawText(qty.text, { x: COLUMNS.qty.x0 + 2, y: topDown(baselineYTop), size: qty.size, font });

      const desc = fitText(font, item.description, COLUMNS.description.x1 - COLUMNS.description.x0, 9);
      page.drawText(desc.text, { x: COLUMNS.description.x0, y: topDown(baselineYTop), size: desc.size, font });
    });
  }

  return outDoc.save();
}
