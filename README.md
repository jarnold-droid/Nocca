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
   The photo itself is used only for this one call and is never stored.
3. **Match** — the extracted customer name is fuzzy-matched against the
   customers stored in the app (`/customers`); you confirm or pick a
   different match — nothing is auto-selected.
4. **Review** — every field is editable before anything is generated. You
   must explicitly confirm the customer name and PO# (the two
   handwriting-prone fields) before sending.
5. **Generate & send** — a handbill PDF is produced in memory by overlaying
   the confirmed data onto `assets/handbill-template.pdf` (a flat,
   non-fillable template) using `pdf-lib`, then emailed (via SendGrid) to a
   configurable office address — plus a CC to a second contact when the
   invoice was tagged YELLOW. Once sent, nothing about that invoice is kept.

**The app is intentionally stateless beyond the customer list.** Once a
handbill is sent, it's sent — there's no invoice log, no stored photos, and
no stored generated PDFs. The *only* thing persisted is the `/customers`
admin list (name + account number), since office staff expect that to still
be there next time they use the app.

## Tech stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Prisma 7** + **Postgres** (via the `@prisma/adapter-pg` driver adapter —
  Prisma 7 requires a driver adapter rather than a bare `url` in the schema),
  holding just the one `Customer` table
- **`@anthropic-ai/sdk`** for vision-based extraction
- **`pdf-lib`** for overlaying text on the flat handbill template, in memory
- **`@sendgrid/mail`** for outbound email

## Deploying to Vercel

1. **Import the repo**: in the Vercel dashboard, "Add New… → Project",
   import this GitHub repo, and pick the `claude/po-invoice-handbill-app-*`
   branch (or merge it to your default branch first).
2. **Add a Postgres database**: in the project's **Storage** tab, "Create
   Database" → Postgres (this is Neon under the hood — no separate account
   needed). Vercel auto-injects a connection string into your project; set
   the app's `DATABASE_URL` env var to that value (copy
   `POSTGRES_PRISMA_URL` if that's the name Vercel gives it — a pooled
   connection string is preferred for a serverless deployment).
3. **Set the rest of the environment variables** (Project → Settings →
   Environment Variables): `ANTHROPIC_API_KEY`, `SENDGRID_API_KEY`,
   `EMAIL_FROM`, `OFFICE_EMAIL`, `SECOND_CONTACT_EMAIL`. For initial testing,
   set both `OFFICE_EMAIL` and `SECOND_CONTACT_EMAIL` to
   `jtcappiello@gmail.com` per the spec — since both land in the same inbox,
   email subjects are prefixed "Office Copy" vs. "Second Contact Copy" so you
   can confirm the yellow-copy CC logic actually fires a second send.
4. **Deploy**. The build runs `prisma migrate deploy` automatically (see the
   `vercel-build` script in `package.json`), so the `Customer` table is
   created on the first deploy with no manual migration step.
5. Open the deployed URL on a phone and try it end to end.

Redeploying later (e.g. after editing the schema) re-runs migrations
automatically the same way.

## Local development

```bash
npm install
cp .env.example .env   # fill in a real Postgres DATABASE_URL + API keys
npm run db:migrate      # applies the schema to that Postgres database
npm run dev
```

Visit http://localhost:3000. Any reachable Postgres works for local dev —
a local install, Docker, or the same Neon/Vercel Postgres database you use
in production.

### Prisma 7 note

Prisma 7 removed the `url` datasource property from `schema.prisma` in
favor of `prisma.config.ts` (used by the CLI for migrations) plus a driver
adapter passed to `PrismaClient` at runtime (see `lib/prisma.ts`). Because
the Prisma CLI no longer auto-loads `.env`, `db:migrate`/`db:studio`/
`postinstall` run through `dotenv-cli` locally; on Vercel the platform
injects env vars directly so nothing extra is needed there.

## Project layout

```
app/
  page.tsx                        # upload → review → confirm & send flow
  customers/page.tsx              # admin: add/edit/delete customer records
  api/extract/route.ts            # photo → Claude vision extraction + fuzzy match (stateless)
  api/send/route.ts               # confirmed data → generate PDF in memory → email (stateless)
  api/customers/                  # customer CRUD + fuzzy-match-by-name endpoint
lib/
  extractInvoice.ts   # Claude vision call + prompt
  fuzzyMatch.ts        # Dice-coefficient customer name matching
  handbillPdf.ts        # pdf-lib overlay onto assets/handbill-template.pdf
  email.ts              # SendGrid sending (reads OFFICE_EMAIL/SECOND_CONTACT_EMAIL from env)
  prisma.ts             # PrismaClient wired to the pg driver adapter
assets/handbill-template.pdf   # the blank handbill template
prisma/schema.prisma            # the one persisted model: Customer
```

## Known limitations / follow-ups

- There's no record of what was sent, to whom, or when — a deliberate
  tradeoff for simplicity. If a trail becomes valuable later (e.g. "did we
  already bill PO #X"), that would mean reintroducing an Invoice/EmailLog
  table and accepting the tradeoffs of storing photos/PDFs somewhere
  (Vercel Blob, S3, etc.), since Vercel's serverless filesystem is ephemeral.
- The handbill template supports 11 line-item rows per page; invoices with
  more line items overflow onto additional (repeated-template) pages
  automatically.
- There is no authentication — this is an internal tool intended to sit
  behind whatever network/VPN restriction the deployment environment
  provides.
