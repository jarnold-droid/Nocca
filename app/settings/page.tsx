"use client";

import { useEffect, useState } from "react";

export default function SettingsPage() {
  const [officeEmail, setOfficeEmail] = useState("");
  const [secondContactEmail, setSecondContactEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setOfficeEmail(data.settings.officeEmail);
        setSecondContactEmail(data.settings.secondContactEmail);
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ officeEmail, secondContactEmail }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to save settings");
      return;
    }
    setSaved(true);
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-slate-600 mt-1">
          Every handbill is emailed to the office address. Yellow-copy invoices are also CC&apos;d
          to the second contact.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-lg p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Office email</label>
          <input
            type="email"
            value={officeEmail}
            onChange={(e) => setOfficeEmail(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Second contact email (CC&apos;d on yellow copies)
          </label>
          <input
            type="email"
            value={secondContactEmail}
            onChange={(e) => setSecondContactEmail(e.target.value)}
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
        </div>
        <button type="submit" className="bg-blue-700 text-white rounded-lg px-4 py-2 font-medium">
          Save
        </button>
        {saved && <p className="text-green-700 text-sm">Saved.</p>}
        {error && <p className="text-red-700 text-sm">{error}</p>}
      </form>
    </div>
  );
}
