"use client";
// src/components/TopupModal.tsx
import { useState } from "react";

const QUICK_AMOUNTS = [100, 500, 1000, 5000];

interface Props {
  onClose: () => void;
  onSuccess: (newBalance: number, message: string) => void;
}

export default function TopupModal({ onClose, onSuccess }: Props) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleTopup() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parsed }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      onSuccess(data.newBalance, data.message);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Add Money</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>Top up your PayNest wallet</p>
          </div>
          <button onClick={onClose} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "var(--text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        </div>

        {/* Quick amounts */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(q.toString())}
              style={{
                padding: "10px 0", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600,
                background: amount === q.toString() ? "var(--accent-soft)" : "var(--bg-input)",
                border: `1px solid ${amount === q.toString() ? "rgba(108,99,255,0.4)" : "var(--border)"}`,
                color: amount === q.toString() ? "var(--accent)" : "var(--text-secondary)",
                transition: "all 0.15s",
              }}
            >
              ₹{q.toLocaleString("en-IN")}
            </button>
          ))}
        </div>

        {/* Custom amount */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
            Or enter custom amount
          </label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", fontSize: 15, fontWeight: 600 }}>₹</span>
            <input
              type="number"
              className="form-input"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1"
              max="100000"
              style={{ paddingLeft: 28 }}
            />
          </div>
        </div>

        {error && (
          <div style={{ background: "var(--red-soft)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#f87171", marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleTopup}
            disabled={loading || !amount}
            style={{ flex: 2 }}
          >
            {loading ? (
              <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> Adding…</>
            ) : `Add ₹${parseFloat(amount || "0").toLocaleString("en-IN") || "0"}`}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
