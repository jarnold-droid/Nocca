# Handbill Generator

A phone-first web app for turning a photo of a food-distributor PO invoice
into a completed "handbill" PDF and emailing it out.

## How it works

1. **Upload** — take/choose a photo of the invoice. The app guesses YELLOW
   (landscape, handwritten PO#/customer) vs. WHITE (portrait, printed PO#/
   customer) from the photo's orientation; you can override the guess.
2. **Extract** — the photo is sent to Claude's vision API, which reads the
   customer name, PO#, delivery date, and line items (qty + description).
   Handwritten/low-confidence customer name and PO# are flagged for review.
3. **Match** — the extracted customer name is fuzzy-matched against the
   customers stored in the app (`/customers`); you confirm or pick a
   different match — nothing is auto-selected.
4. **Review** — every field is editable before anything is generated. You
   must explicitly confirm the customer name and PO# (the two
   handwriting-prone fields) before sending.
5. **Generate** — a handbill PDF is produced by overlaying the confirmed
   data onto `assets/handbill-template.pdf` (a flat, non-fillable template)
   at hand-measured coordinates, using `pdf-lib`.
6. **Send** — the handbill is emailed (via SendGrid) to a configurable
   office address, and additionally CC'd to a second contact when the
   invoice was tagged YELLOW.
7. **Log** — every invoice (photo, extracted data, matched customer,
   generated PDF, and every send attempt) is recorded and browsable at
   `/invoices`.

## Tech stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Prisma 7** + SQLite (via the `@prisma/adapter-libsql` driver adapter —
  Prisma 7 requires a driver adapter rather than a bare `url` in the schema)
- **`@anthropic-ai/sdk`** for vision-based extraction
- **`pdf-lib`** for overlaying text on the flat handbill template
- **`@sendgrid/mail`** for outbound email

## Getting started

```bash
npm install
cp .env.example .env   # then fill in the real values below
npm run db:migrate      # creates dev.db and applies the schema
npm run dev
```

Visit http://localhost:3000.

### Required environment variables (see `.env.example`)

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLite file, e.g. `file:./dev.db` |
| `ANTHROPIC_API_KEY` | Used for the vision extraction call |
| `SENDGRID_API_KEY` / `EMAIL_FROM` | Used to send the handbill emails |
| `OFFICE_EMAIL` / `SECOND_CONTACT_EMAIL` | Seed values for the `Settings` row (see below) — set to `jtcappiello@gmail.com` for initial testing per the spec |
| `STORAGE_DIR` | Where uploaded photos and generated PDFs are stored on disk (default `./storage`, gitignored) |

The **office email** and **second contact email** can also be changed later
at runtime from the `/settings` screen — no redeploy needed, since they're
stored in the database (env vars only seed the initial values).

> Because `SENDGRID_API_KEY`/`EMAIL_FROM` are both used for every send in
> testing, subjects are prefixed with **"Office Copy"** vs. **"Second
> Contact Copy"** so you can confirm the yellow-copy CC logic fired a
> second send even when both land in the same inbox.

### Prisma 7 note

Prisma 7 removed the `url` datasource property from `schema.prisma` in
favor of `prisma.config.ts` (used by the CLI for migrations) plus a driver
adapter passed to `PrismaClient` at runtime (see `lib/prisma.ts`). Because
the Prisma CLI no longer auto-loads `.env`, `db:migrate`/`db:studio`/
`postinstall` run through `dotenv-cli`.

## Project layout

```
app/
  page.tsx                        # upload → review → confirm & send flow
  customers/page.tsx              # admin: add/edit/delete customer records
  settings/page.tsx               # admin: office / second-contact email
  invoices/page.tsx                # log of every processed invoice
  invoices/[id]/page.tsx          # detail view: photo, PDF, email log, resend
  api/invoices/upload/route.ts    # save photo, run extraction, fuzzy-match
  api/invoices/[id]/confirm/route.ts  # finalize, generate PDF, send email
  api/invoices/[id]/resend/route.ts   # retry sending an already-generated PDF
  api/customers/, api/settings/   # admin CRUD APIs
lib/
  extractInvoice.ts   # Claude vision call + prompt
  fuzzyMatch.ts        # Dice-coefficient customer name matching
  handbillPdf.ts        # pdf-lib overlay onto assets/handbill-template.pdf
  email.ts              # SendGrid sending + Settings read/write
  storage.ts            # local-disk photo/PDF storage
  prisma.ts             # PrismaClient wired to the libsql driver adapter
assets/handbill-template.pdf   # the blank handbill template
prisma/schema.prisma            # Customer, Invoice, InvoiceLineItem, EmailLog, Settings
```

## Known limitations / follow-ups

- Photos and generated PDFs are stored on local disk (`STORAGE_DIR`). This
  is fine for a single-instance deployment; a multi-instance or serverless
  deployment would need to swap `lib/storage.ts` for S3 (or similar).
- The handbill template supports 11 line-item rows per page; invoices with
  more line items overflow onto additional (repeated-template) pages
  automatically.
- There is no authentication — this is an internal tool intended to sit
  behind whatever network/VPN restriction the deployment environment
  provides.
