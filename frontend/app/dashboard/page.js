"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

const money = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

export default function Dashboard() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [topupAmount, setTopupAmount] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null); // the person we're sending to
  const [message, setMessage] = useState(null); // { type: "ok" | "error", text }

  // load balance + current page of history
  const refresh = useCallback(async () => {
    try {
      const [b, t] = await Promise.all([
        api("/wallet/balance"),
        api(`/wallet/transactions?page=${page}&limit=8`),
      ]);
      setBalance(b.balance);
      setTransactions(t.transactions);
      setTotalPages(t.totalPages);
    } catch (err) {
      console.log(err.message);
    }
  }, [page]);

  // first load, then poll every 5 seconds so the balance stays live
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/");
      return;
    }
    setName(localStorage.getItem("name") || "");
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh, router]);

  // user search, waits 300ms after typing stops
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const data = await api(`/users/search?q=${encodeURIComponent(query.trim())}`);
        setResults(data.users);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function handleTopup(e) {
    e.preventDefault();
    setMessage(null);
    try {
      const data = await api("/wallet/topup", { method: "POST", body: { amount: topupAmount } });
      setMessage({ type: "ok", text: data.message });
      setTopupAmount("");
      refresh();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    setMessage(null);
    if (!selected) {
      setMessage({ type: "error", text: "Search and pick who you want to pay" });
      return;
    }
    try {
      const data = await api("/wallet/transfer", {
        method: "POST",
        body: { toEmail: selected.email, amount: sendAmount },
      });
      setMessage({ type: "ok", text: data.message });
      setSendAmount("");
      setSelected(null);
      setQuery("");
      refresh();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    }
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    router.push("/");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-teal-900">PayNest</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600">Hi, {name}</span>
          <button onClick={logout} className="text-teal-800 underline">Log out</button>
        </div>
      </header>

      {message && (
        <p className={`mb-4 rounded-lg px-4 py-2 text-sm ${message.type === "ok" ? "bg-teal-50 text-teal-900" : "bg-red-50 text-red-700"}`}>
          {message.text}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-5">
        {/* left side: balance + actions */}
        <div className="space-y-6 md:col-span-2">
          <section className="rounded-xl bg-teal-900 p-6 text-white">
            <p className="text-sm text-teal-100">Your balance</p>
            <p className="mt-1 text-4xl font-extrabold">{balance === null ? "..." : money(balance)}</p>
          </section>

          <form onSubmit={handleTopup} className="card space-y-3">
            <h2 className="font-bold">Add money</h2>
            <input className="input" type="number" min="1" step="0.01" placeholder="Amount in Rs" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} />
            <button className="btn w-full">Add money</button>
          </form>

          <form onSubmit={handleSend} className="card space-y-3">
            <h2 className="font-bold">Send money</h2>

            {selected ? (
              <div className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm">
                <span>{selected.name} <span className="text-slate-500">({selected.email})</span></span>
                <button type="button" className="text-teal-800 underline" onClick={() => setSelected(null)}>Change</button>
              </div>
            ) : (
              <div className="relative">
                <input className="input" placeholder="Search by name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
                {results.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
                    {results.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-100"
                          onClick={() => { setSelected(u); setResults([]); }}
                        >
                          {u.name} <span className="text-slate-500">({u.email})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <input className="input" type="number" min="1" step="0.01" placeholder="Amount in Rs" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} />
            <button className="btn w-full">Send money</button>
          </form>
        </div>

        {/* right side: history */}
        <section className="card md:col-span-3">
          <h2 className="mb-3 font-bold">Transactions</h2>

          {transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Nothing here yet. Add some money to get started.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-semibold">{t.title}</p>
                    <p className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                  <p className={`text-sm font-bold ${t.direction === "credit" ? "text-teal-700" : "text-slate-800"}`}>
                    {t.direction === "credit" ? "+" : "-"}{money(t.amount)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <button className="text-teal-800 underline disabled:opacity-40" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
              <span className="text-slate-500">Page {page} of {totalPages}</span>
              <button className="text-teal-800 underline disabled:opacity-40" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
