"use client";
// src/components/TransactionList.tsx
import { useEffect, useState, useCallback } from "react";

interface TxUser {
  id: number;
  name: string;
  email: string;
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  status: string;
  note: string | null;
  senderId: number | null;
  receiverId: number | null;
  createdAt: string;
  sender: TxUser | null;
  receiver: TxUser | null;
}

interface Props {
  userId: number;
  refreshTrigger: number;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function TransactionList({ userId, refreshTrigger }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions?page=${p}&limit=8`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
        setTotalPages(data.pagination.totalPages);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions(page);
  }, [page, refreshTrigger, fetchTransactions]);

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: 64 }} />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
        <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>No transactions yet</p>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 4 }}>Add money or send a transfer to get started</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {transactions.map((tx, i) => {
          const isCredit = tx.type === "TOPUP" || tx.receiverId === userId;
          const isDebit = tx.senderId === userId;
          const otherParty = isDebit ? tx.receiver : tx.sender;

          let icon = "⬆️";
          let label = "Top-up";
          let subLabel = "Added to wallet";

          if (tx.type === "TRANSFER") {
            if (isDebit) {
              icon = "⬆️";
              label = `To ${otherParty?.name ?? "Unknown"}`;
              subLabel = otherParty?.email ?? "";
            } else {
              icon = "⬇️";
              label = `From ${otherParty?.name ?? "Unknown"}`;
              subLabel = otherParty?.email ?? "";
            }
          }

          return (
            <div
              key={tx.id}
              className="animate-fade-in"
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 14px", borderRadius: 12,
                background: "var(--bg-card)", border: "1px solid var(--border)",
                transition: "background 0.15s, border-color 0.15s",
                animationDelay: `${i * 0.04}s`,
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "var(--bg-card-hover)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = "var(--bg-card)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
              }}
            >
              {/* Icon */}
              <div style={{
                width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 16, flexShrink: 0,
                background: isCredit ? "var(--green-soft)" : "rgba(244,63,94,0.1)",
              }}>
                {tx.type === "TOPUP" ? "💳" : isCredit ? "⬇️" : "⬆️"}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {label}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                  {tx.note ? `${tx.note} · ` : ""}{formatDate(tx.createdAt)}
                </div>
              </div>

              {/* Amount */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{
                  fontWeight: 700, fontSize: 14,
                  color: isCredit ? "var(--green)" : "var(--red)",
                  fontFamily: "var(--font-mono)",
                }}>
                  {isCredit ? "+" : "−"}₹{tx.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <div style={{ fontSize: 10, color: tx.status === "SUCCESS" ? "var(--green)" : "var(--red)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                  {tx.status}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 20 }}>
          <button
            className="btn btn-ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{ padding: "6px 14px", fontSize: 13 }}
          >
            ← Prev
          </button>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-ghost"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{ padding: "6px 14px", fontSize: 13 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
