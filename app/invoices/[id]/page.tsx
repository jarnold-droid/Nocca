"use client";

import { useEffect, useState, use as usePromise } from "react";

interface LineItem {
  id: string;
  quantity: string;
  description: string;
}

interface EmailLog {
  id: string;
  recipient: string;
  label: string;
  subject: string;
  success: boolean;
  error: string | null;
  sentAt: string;
}

interface InvoiceDetail {
  id: string;
  status: string;
  format: string;
  customerNameRaw: string | null;
  customer: { name: string; accountNumber: string } | null;
  purchaseOrder: string;
  deliveryDate: string;
  pdfPath: string | null;
  createdAt: string;
  lineItems: LineItem[];
  emailLogs: EmailLog[];
}

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/invoices/${id}`);
    const data = await res.json();
    setInvoice(data.invoice);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount/id change, re-invoked manually after resend
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleResend() {
    setResending(true);
    await fetch(`/api/invoices/${id}/resend`, { method: "POST" });
    setResending(false);
    load();
  }

  if (loading || !invoice) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{invoice.customer?.name ?? invoice.customerNameRaw}</h1>
        <p className="text-slate-500">
          PO #{invoice.purchaseOrder} · {invoice.deliveryDate} ·{" "}
          {new Date(invoice.createdAt).toLocaleString()}
        </p>
      </div>

      <div className="flex gap-2">
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-200 text-slate-700">
          {invoice.format}
        </span>
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-200 text-slate-700">
          {invoice.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="font-medium mb-2">Original photo</h2>
          <img src={`/api/invoices/${id}/photo`} alt="Original invoice" className="rounded border" />
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="font-medium mb-2">Handbill</h2>
          {invoice.pdfPath ? (
            <a href={`/api/invoices/${id}/pdf`} target="_blank" rel="noreferrer" className="text-blue-700 underline">
              View / download PDF
            </a>
          ) : (
            <p className="text-slate-500 text-sm">Not generated yet.</p>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <h2 className="font-medium mb-2">Line items</h2>
        <table className="w-full text-sm">
          <tbody>
            {invoice.lineItems.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="py-1 pr-4 text-slate-500 w-16">{item.quantity}</td>
                <td className="py-1">{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Email log</h2>
          {invoice.pdfPath && (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-blue-700 text-sm underline disabled:opacity-40"
            >
              {resending ? "Resending…" : "Resend"}
            </button>
          )}
        </div>
        {invoice.emailLogs.length === 0 ? (
          <p className="text-slate-500 text-sm">No send attempts yet.</p>
        ) : (
          <ul className="space-y-2">
            {invoice.emailLogs.map((log) => (
              <li key={log.id} className="text-sm flex justify-between border-t border-slate-100 pt-2">
                <span>
                  <span className="font-medium">{log.label}</span> → {log.recipient}
                </span>
                <span className={log.success ? "text-green-700" : "text-red-700"}>
                  {log.success ? "sent" : `failed: ${log.error}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
