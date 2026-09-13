"use client";

import { useEffect, useState } from "react";

interface Customer {
  id: string;
  name: string;
  accountNumber: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAccount, setEditAccount] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/customers");
    const data = await res.json();
    setCustomers(data.customers);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time fetch on mount, re-invoked manually after mutations
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, accountNumber }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to add customer");
      return;
    }
    setName("");
    setAccountNumber("");
    load();
  }

  function startEdit(c: Customer) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditAccount(c.accountNumber);
  }

  async function saveEdit(id: string) {
    await fetch(`/api/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, accountNumber: editAccount }),
    });
    setEditingId(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this customer record?")) return;
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customers</h1>

      <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <h2 className="font-medium">Add a customer</h2>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Customer name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="flex-1 min-w-[200px] border border-slate-300 rounded-lg px-3 py-2"
          />
          <input
            type="text"
            placeholder="Account number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
            className="w-40 border border-slate-300 rounded-lg px-3 py-2"
          />
          <button type="submit" className="bg-blue-700 text-white rounded-lg px-4 py-2 font-medium">
            Add
          </button>
        </div>
        {error && <p className="text-red-700 text-sm">{error}</p>}
      </form>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y">
          {customers.length === 0 && <p className="p-4 text-slate-500">No customers yet.</p>}
          {customers.map((c) => (
            <div key={c.id} className="p-4 flex items-center gap-3">
              {editingId === c.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2"
                  />
                  <input
                    value={editAccount}
                    onChange={(e) => setEditAccount(e.target.value)}
                    className="w-40 border border-slate-300 rounded-lg px-3 py-2"
                  />
                  <button onClick={() => saveEdit(c.id)} className="text-blue-700 font-medium">
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="text-slate-500">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-slate-500">Acct #{c.accountNumber}</div>
                  </div>
                  <button onClick={() => startEdit(c)} className="text-blue-700 text-sm">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 text-sm">
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
