import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const STORAGE_ROOT = path.resolve(/* turbopackIgnore: true */ process.env.STORAGE_DIR || "./storage");
const PHOTOS_DIR = path.join(STORAGE_ROOT, "photos");
const PDFS_DIR = path.join(STORAGE_ROOT, "pdfs");

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

/** Saves an uploaded invoice photo. Returns the relative path stored on the Invoice record. */
export async function savePhoto(bytes: Buffer, extension: string): Promise<string> {
  await ensureDir(PHOTOS_DIR);
  const filename = `${randomUUID()}.${extension.replace(/[^a-z0-9]/gi, "") || "jpg"}`;
  await writeFile(path.join(PHOTOS_DIR, filename), bytes);
  return path.join("photos", filename);
}

/** Saves a generated handbill PDF. Returns the relative path stored on the Invoice record. */
export async function savePdf(bytes: Uint8Array, invoiceId: string): Promise<string> {
  await ensureDir(PDFS_DIR);
  const filename = `handbill-${invoiceId}.pdf`;
  await writeFile(path.join(PDFS_DIR, filename), bytes);
  return path.join("pdfs", filename);
}

/** Reads back a file previously saved with savePhoto/savePdf, given its stored relative path. */
export async function readStoredFile(relativePath: string): Promise<Buffer> {
  const resolved = path.resolve(STORAGE_ROOT, relativePath);
  if (!resolved.startsWith(STORAGE_ROOT)) {
    throw new Error("Invalid storage path");
  }
  return readFile(resolved);
}
