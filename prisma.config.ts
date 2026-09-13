import path from "node:path";
import { defineConfig } from "prisma/config";

// Prisma 7 moved the datasource connection URL out of schema.prisma and into
// this config file (used by `prisma migrate`/`prisma studio`). The running
// app itself connects via the driver adapter in lib/prisma.ts.
//
// Read directly from process.env (rather than @prisma/config's `env()`
// helper, which throws when the variable is unset) so that `prisma generate`
// still succeeds in environments that don't need a live connection — e.g.
// a Vercel build step running before DATABASE_URL is otherwise consulted.
export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
