"use client";

import { useRef, useState, useEffect, useCallback } from "react";

type InvoiceFormat = "YELLOW" | "WHITE";

interface LineItem {
  quantity: string;
  description: string;
}

interface MatchCandidate {
  id: string;
  name: string;
  accountNumber: string;
  score: number;
}

interface ExtractResponse {
  extraction: {
    format: InvoiceFormat;
    customerName: string;
    customerNameNeedsReview: boolean;
    purchaseOrder: string;
    purchaseOrderNeedsReview: boolean;
    deliveryDate: string;
    lineItems: LineItem[];
    notes: string;
  };
  matches: MatchCandidate[];
}

interface SendResult {
  recipient: string;
  label: string;
  success: boolean;
  error?: string;
}

type Stage = "capture" | "extracting" | "review" | "submitting" | "done" | "error";

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("capture");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [format, setFormat] = useState<InvoiceFormat>("WHITE");
  const [customerNameInput, setCustomerNameInput] = useState("");
  const [customerNameConfirmed, setCustomerNameConfirmed] = useState(false);
  const [purchaseOrder, setPurchaseOrder] = useState("");
  const [purchaseOrderConfirmed, setPurchaseOrderConfirmed] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [sendResults, setSendResults] = useState<SendResult[]>([]);
  const [sentPdfUrl, setSentPdfUrl] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const refreshMatches = useCallback(async (name: string) => {
    if (!name.trim()) {
      setMatches([]);
      return;
    }
    const res = await fetch(`/api/customers/match?name=${encodeURIComponent(name)}`);
    if (res.ok) {
      const data = await res.json();
      setMatches(data.matches);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => refreshMatches(customerNameInput), 300);
    return () => clearTimeout(timeout);
  }, [customerNameInput, refreshMatches]);

  async function handleFileChosen(file: File) {
    setPreviewUrl(URL.createObjectURL(file));
    setStage("extracting");
    setErrorMessage("");

    const { width, height } = await readImageDimensions(file);

    const formData = new FormData();
    formData.append("photo", file);
    formData.append("width", String(width));
    formData.append("height", String(height));

    try {
      const res = await fetch("/api/extract", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Extraction failed");
      }
      const payload = data as ExtractResponse;
      setFormat(payload.extraction.format);
      setCustomerNameInput(payload.extraction.customerName);
      setCustomerNameConfirmed(!payload.extraction.customerNameNeedsReview);
      setPurchaseOrder(payload.extraction.purchaseOrder);
      setPurchaseOrderConfirmed(!payload.extraction.purchaseOrderNeedsReview);
      setDeliveryDate(payload.extraction.deliveryDate);
      setLineItems(
        payload.extraction.lineItems.length > 0
          ? payload.extraction.lineItems
          : [{ quantity: "", description: "" }]
      );
      setMatches(payload.matches);
      setSelectedCustomerId(null); // never auto-select a customer — the user must confirm
      setNotes(payload.extraction.notes);
      setStage("review");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStage("error");
    }
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string) {
    setLineItems((items) => items.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addLineItem() {
    setLineItems((items) => [...items, { quantity: "", description: "" }]);
  }

  function removeLineItem(index: number) {
    setLineItems((items) => items.filter((_, i) => i !== index));
  }

  const hasMinimumFields =
    customerNameInput.trim().length > 0 &&
    purchaseOrder.trim().length > 0 &&
    lineItems.some((item) => item.description.trim().length > 0);

  const canSubmit = customerNameConfirmed && purchaseOrderConfirmed && hasMinimumFields;

  function buildHandbillRequestBody() {
    return {
      format,
      customerId: selectedCustomerId,
      customerName: customerNameInput.trim(),
      purchaseOrder: purchaseOrder.trim(),
      deliveryDate: deliveryDate.trim(),
      lineItems: lineItems.filter((item) => item.description.trim().length > 0),
    };
  }

  async function handlePreview() {
    setPreviewing(true);
    setErrorMessage("");
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildHandbillRequestBody()),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate preview");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setPreviewing(false);
    }
  }

  async function handleConfirmAndSend() {
    setStage("submitting");
    setErrorMessage("");
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildHandbillRequestBody()),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send handbill");
      }
      setSendResults(data.sendResults);
      const bytes = Uint8Array.from(atob(data.pdfBase64), (c) => c.charCodeAt(0));
      setSentPdfUrl(URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })));
      setStage("done");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
      setStage("error");
    }
  }

  function startOver() {
    setStage("capture");
    setPreviewUrl(null);
    setCustomerNameInput("");
    setCustomerNameConfirmed(false);
    setPurchaseOrder("");
    setPurchaseOrderConfirmed(false);
    setDeliveryDate("");
    setLineItems([]);
    setMatches([]);
    setSelectedCustomerId(null);
    setSendResults([]);
    if (sentPdfUrl) URL.revokeObjectURL(sentPdfUrl);
    setSentPdfUrl(null);
    setErrorMessage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  if (stage === "capture") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Upload an invoice photo</h1>
          <p className="text-slate-600 mt-1">
            Take a photo of the PO invoice. We&apos;ll read the customer, PO#, date, and items and
            turn it into a handbill.
          </p>
        </div>
        <label className="block border-2 border-dashed border-blue-300 rounded-xl p-8 text-center cursor-pointer bg-white hover:bg-blue-50 transition">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileChosen(file);
            }}
          />
          <div className="text-blue-700 font-medium text-lg">📷 Take or choose a photo</div>
          <div className="text-slate-500 text-sm mt-1">JPEG or PNG</div>
        </label>
      </div>
    );
  }

  if (stage === "extracting") {
    return (
      <div className="space-y-4 text-center py-12">
        {previewUrl && (
          <img src={previewUrl} alt="Invoice preview" className="max-h-64 mx-auto rounded-lg border" />
        )}
        <p className="text-slate-600 animate-pulse">Reading the invoice…</p>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          {errorMessage}
        </div>
        <button onClick={startOver} className="text-blue-700 underline">
          Start over
        </button>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
          Handbill sent for PO #{purchaseOrder}.
        </div>
        <ul className="space-y-2">
          {sendResults.map((r, i) => (
            <li
              key={i}
              className={`rounded-lg p-3 border text-sm ${
                r.success ? "bg-white border-slate-200" : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <span className="font-medium">{r.label}</span> → {r.recipient} —{" "}
              {r.success ? "sent" : `failed: ${r.error}`}
            </li>
          ))}
        </ul>
        {sentPdfUrl && (
          <a
            href={sentPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="block text-blue-700 underline"
          >
            View the handbill that was sent
          </a>
        )}
        <button onClick={startOver} className="text-blue-700 underline">
          Process another invoice
        </button>
      </div>
    );
  }

  // review + submitting
  return (
    <div className="space-y-6 pb-24">
      {previewUrl && (
        <img src={previewUrl} alt="Invoice preview" className="max-h-48 mx-auto rounded-lg border" />
      )}

      {notes && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm">
          {notes}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Copy type</label>
        <div className="flex gap-2">
          {(["YELLOW", "WHITE"] as InvoiceFormat[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                format === f
                  ? f === "YELLOW"
                    ? "bg-yellow-300 border-yellow-500"
                    : "bg-slate-200 border-slate-400"
                  : "bg-white border-slate-300 text-slate-500"
              }`}
            >
              {f === "YELLOW" ? "Yellow copy" : "White copy"}
            </button>
          ))}
        </div>
        {format === "YELLOW" && (
          <p className="text-xs text-slate-500 mt-1">
            Yellow copies also CC the second contact when sent.
          </p>
        )}
      </div>

      <div className={`rounded-lg border p-4 space-y-3 ${customerNameConfirmed ? "border-slate-200 bg-white" : "border-amber-400 bg-amber-50"}`}>
        <label className="block text-sm font-medium text-slate-700">Customer name</label>
        <input
          type="text"
          value={customerNameInput}
          onChange={(e) => {
            setCustomerNameInput(e.target.value);
            setSelectedCustomerId(null);
          }}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        />

        {matches.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Closest matches on file — confirm one, or keep the typed name:</p>
            {matches.map((m) => (
              <label key={m.id} className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2 cursor-pointer">
                <input
                  type="radio"
                  name="customerMatch"
                  checked={selectedCustomerId === m.id}
                  onChange={() => {
                    setSelectedCustomerId(m.id);
                    setCustomerNameInput(m.name);
                  }}
                />
                <span className="flex-1">{m.name}</span>
                <span className="text-slate-500">Acct #{m.accountNumber}</span>
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm px-3 py-1 cursor-pointer text-slate-500">
              <input
                type="radio"
                name="customerMatch"
                checked={selectedCustomerId === null}
                onChange={() => setSelectedCustomerId(null)}
              />
              None of these — use the name as typed
            </label>
          </div>
        )}

        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={customerNameConfirmed}
            onChange={(e) => setCustomerNameConfirmed(e.target.checked)}
          />
          I&apos;ve verified this customer name is correct
        </label>
      </div>

      <div className={`rounded-lg border p-4 space-y-3 ${purchaseOrderConfirmed ? "border-slate-200 bg-white" : "border-amber-400 bg-amber-50"}`}>
        <label className="block text-sm font-medium text-slate-700">Purchase order #</label>
        <input
          type="text"
          value={purchaseOrder}
          onChange={(e) => setPurchaseOrder(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        />
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={purchaseOrderConfirmed}
            onChange={(e) => setPurchaseOrderConfirmed(e.target.checked)}
          />
          I&apos;ve verified this PO# is correct
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Date of delivery</label>
        <input
          type="text"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700">Line items</label>
        {lineItems.map((item, i) => (
          <div key={i} className="flex gap-2 items-start">
            <input
              type="text"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => updateLineItem(i, "quantity", e.target.value)}
              className="w-16 border border-slate-300 rounded-lg px-2 py-2"
            />
            <input
              type="text"
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateLineItem(i, "description", e.target.value)}
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2"
            />
            <button
              type="button"
              onClick={() => removeLineItem(i)}
              className="text-red-600 px-2 py-2"
              aria-label="Remove line item"
            >
              ✕
            </button>
          </div>
        ))}
        <button type="button" onClick={addLineItem} className="text-blue-700 text-sm underline">
          + Add line item
        </button>
      </div>

      <button
        type="button"
        onClick={handlePreview}
        disabled={!hasMinimumFields || previewing}
        className="w-full border border-blue-300 text-blue-700 rounded-lg py-2 font-medium disabled:opacity-40"
      >
        {previewing ? "Generating preview…" : "Preview handbill PDF"}
      </button>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
          {errorMessage}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button onClick={startOver} className="px-4 py-3 rounded-lg border border-slate-300 text-slate-600">
            Cancel
          </button>
          <button
            onClick={handleConfirmAndSend}
            disabled={!canSubmit || stage === "submitting"}
            className="flex-1 bg-blue-700 text-white rounded-lg py-3 font-medium disabled:opacity-40"
          >
            {stage === "submitting" ? "Sending…" : "Confirm & Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
