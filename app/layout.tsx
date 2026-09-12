import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nudge",
  description: "Turn a photo of a PO invoice into a handbill and email it",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <nav className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold text-lg text-blue-700">
              Nudge
            </Link>
            <div className="flex gap-4 text-sm text-slate-600">
              <Link href="/customers" className="hover:text-blue-700">
                Customers
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
