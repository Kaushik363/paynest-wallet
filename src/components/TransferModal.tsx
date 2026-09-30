"use client";
// src/components/TransferModal.tsx
import { useState, useEffect, useRef } from "react";

interface UserResult {
  id: number;
  name: string;
  email: string;
}

interface Props {
  balance: number;
  onClose: () => void;
  onSuccess: (newBalance: number, message: string) => void;
}

export default function TransferModal({ balance, onClose, onSuccess }: Props) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [step, setStep] = useState<"recipient" | "amount">("recipient");
  const searchTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (recipientName) return; // already selected
    if (searchTimer.current) clearTimeout(searchTimer.current);

    if (recipientEmail.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(recipientEmail)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.users);
          setShowDropdown(data.users.length > 0);
        }
      } catch {
        /* ignore */
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [recipientEmail, recipientName]);

  function selectUser(user: UserResult) {
    setRecipientEmail(user.email);
    setRecipientName(user.name);
    setShowDropdown(false);
    setSearchResults([]);
  }

  function clearRecipient() {
    setRecipientEmail("");
    setRecipientName("");
    setStep("recipient");
  }

  async function handleTransfer() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { setError("Enter a valid amount"); return; }
    if (parsed > balance) { setError("Insufficient balance"); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail, amount: parsed, note: note || undefined }),
      });
      const data = await res.json();

      if (!data.success) { setError(data.message); return; }
      onSuccess(data.newBalance, data.message);
    } catch {
      setError("Transfer failed. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Send Money</h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
              Balance: <span style={{ color: "var(--green)", fontWeight: 600 }}>₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: "var(--bg-input)", border: "1px solid var(--border)", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "var(--text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Recipient */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
              Recipient
            </label>

            {recipientName ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--green-soft)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                  {recipientName[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{recipientName}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{recipientEmail}</div>
                </div>
                <button onClick={clearRecipient} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 14, padding: 4 }}>✕</button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by name or email"
                  value={recipientEmail}
                  onChange={(e) => { setRecipientEmail(e.target.value); setRecipientName(""); }}
                  autoComplete="off"
                />
                {searching && (
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block" }} />
                )}
                {showDropdown && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden", zIndex: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => selectUser(u)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.1s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-card-hover)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                          {u.name[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{u.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Amount */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>Amount</label>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)", fontSize: 15, fontWeight: 600 }}>₹</span>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                max="50000"
                style={{ paddingLeft: 28 }}
              />
            </div>
            {parseFloat(amount) > balance && (
              <p style={{ fontSize: 12, color: "var(--red)", marginTop: 4 }}>Amount exceeds your balance</p>
            )}
          </div>

          {/* Note */}
          <div>
            <label style={{ display: "block", fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
              Note <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Lunch split, rent..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={100}
            />
          </div>

          {error && (
            <div style={{ background: "var(--red-soft)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "#f87171" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button
              className="btn btn-primary"
              onClick={handleTransfer}
              disabled={loading || !recipientEmail || !amount || parseFloat(amount) > balance}
              style={{ flex: 2 }}
            >
              {loading ? (
                <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> Sending…</>
              ) : `Send ₹${parseFloat(amount || "0").toLocaleString("en-IN") || "0"}`}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
