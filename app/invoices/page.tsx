"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface InvoiceSummary {
  id: string;
  status: string;
  format: string;
  customerNameRaw: string | null;
  customer: { name: string; accountNumber: string } | null;
  purchaseOrder: string;
  deliveryDate: string;
  createdAt: string;
}

const statusStyles: Record<string, string> = {
  SENT: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  PENDING_REVIEW: "bg-amber-100 text-amber-800",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/invoices")
      .then((r) => r.json())
      .then((data) => {
        setInvoices(data.invoices);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Invoice log</h1>
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : invoices.length === 0 ? (
        <p className="text-slate-500">No invoices processed yet.</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y">
          {invoices.map((inv) => (
            <Link
              key={inv.id}
              href={`/invoices/${inv.id}`}
              className="p-4 flex items-center gap-3 hover:bg-slate-50"
            >
              <div className="flex-1">
                <div className="font-medium">{inv.customer?.name ?? inv.customerNameRaw}</div>
                <div className="text-sm text-slate-500">
                  PO #{inv.purchaseOrder} · {inv.deliveryDate} ·{" "}
                  {new Date(inv.createdAt).toLocaleString()}
                </div>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  inv.format === "YELLOW" ? "bg-yellow-200 text-yellow-900" : "bg-slate-200 text-slate-700"
                }`}
              >
                {inv.format}
              </span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusStyles[inv.status] ?? ""}`}>
                {inv.status.replace("_", " ")}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
