"use client";
// src/app/dashboard/page.tsx
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import TopupModal from "@/components/TopupModal";
import TransferModal from "@/components/TransferModal";
import TransactionList from "@/components/TransactionList";

interface WalletData {
  balance: number;
  name: string;
  email: string;
}

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

export default function DashboardPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [refreshTx, setRefreshTx] = useState(0);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet/balance");
      if (res.status === 401) {
        router.push("/auth/login");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setWallet({ balance: data.balance, name: data.name, email: data.email });
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  function addToast(message: string, type: "success" | "error" = "success") {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }

  function handleTopupSuccess(newBalance: number, message: string) {
    setWallet((prev) => prev ? { ...prev, balance: newBalance } : prev);
    setShowTopup(false);
    setRefreshTx((n) => n + 1);
    addToast(message, "success");
  }

  function handleTransferSuccess(newBalance: number, message: string) {
    setWallet((prev) => prev ? { ...prev, balance: newBalance } : prev);
    setShowTransfer(false);
    setRefreshTx((n) => n + 1);
    addToast(message, "success");
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
    router.refresh();
  }

  const initials = wallet?.name
    ? wallet.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)" }}>
      {/* Fixed background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-10%", right: "-5%",
          width: 500, height: 500,
          background: "radial-gradient(circle, rgba(108,99,255,0.06) 0%, transparent 70%)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", bottom: "10%", left: "-5%",
          width: 400, height: 400,
          background: "radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 70%)",
          borderRadius: "50%",
        }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", padding: "0 16px 60px" }}>
        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 24 }}>🪺</div>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.03em" }}>PayNest</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ textAlign: "right", display: "none" }} className="sm:block">
              {wallet && (
                <>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{wallet.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{wallet.email}</div>
                </>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-ghost"
              style={{ padding: "7px 14px", fontSize: 13 }}
            >
              Sign out
            </button>
          </div>
        </header>

        {/* Balance card */}
        <div
          className="animate-slide-up"
          style={{
            marginTop: 16, borderRadius: 24, padding: "32px 28px",
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #1a1a2e 100%)",
            border: "1px solid rgba(108,99,255,0.25)",
            position: "relative", overflow: "hidden",
          }}
        >
          {/* Card glow */}
          <div style={{
            position: "absolute", top: -60, right: -60,
            width: 200, height: 200,
            background: "radial-gradient(circle, rgba(108,99,255,0.2) 0%, transparent 70%)",
            borderRadius: "50%", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: -40, left: "30%",
            width: 160, height: 160,
            background: "radial-gradient(circle, rgba(34,197,94,0.08) 0%, transparent 70%)",
            borderRadius: "50%", pointerEvents: "none",
          }} />

          <div style={{ position: "relative", zIndex: 1 }}>
            {/* Avatar + greeting */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "linear-gradient(135deg, var(--accent), #a78bfa)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 800, color: "white", flexShrink: 0,
              }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Good {getTimeOfDay()},</div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{wallet?.name ?? "—"}</div>
              </div>
            </div>

            {/* Balance */}
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>
                Wallet Balance
              </div>
              {loading ? (
                <div className="skeleton" style={{ height: 48, width: 200 }} />
              ) : (
                <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em", fontFamily: "var(--font-mono)", color: "white" }}>
                  ₹<span>{wallet?.balance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                className="btn"
                onClick={() => setShowTopup(true)}
                style={{
                  flex: 1, padding: "11px 0",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "white", fontSize: 14,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.14)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              >
                <span style={{ fontSize: 16 }}>+</span> Add Money
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setShowTransfer(true)}
                style={{ flex: 1, padding: "11px 0", fontSize: 14 }}
              >
                <span style={{ fontSize: 14 }}>↑</span> Send
              </button>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="animate-slide-up stagger-2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
          {[
            { label: "Send Limit", value: "₹50K", icon: "⬆️", sub: "per transfer" },
            { label: "Top-up Limit", value: "₹1L", icon: "💳", sub: "per transaction" },
            { label: "Status", value: "Active", icon: "✅", sub: "account" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card" style={{ padding: "14px 12px", textAlign: "center" }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="animate-slide-up stagger-3" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Transactions</h2>
            <button
              onClick={() => setRefreshTx((n) => n + 1)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 16, padding: 4, transition: "color 0.15s" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)")}
              title="Refresh"
            >
              ↻
            </button>
          </div>
          {wallet && (
            <TransactionList userId={0} refreshTrigger={refreshTx} />
          )}
          {!wallet && !loading && (
            <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)", fontSize: 14 }}>
              Could not load wallet data
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showTopup && (
        <TopupModal
          onClose={() => setShowTopup(false)}
          onSuccess={handleTopupSuccess}
        />
      )}
      {showTransfer && wallet && (
        <TransferModal
          balance={wallet.balance}
          onClose={() => setShowTransfer(false)}
          onSuccess={handleTransferSuccess}
        />
      )}

      {/* Toast notifications */}
      <div style={{ position: "fixed", bottom: 24, right: 20, display: "flex", flexDirection: "column", gap: 8, zIndex: 100 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="animate-slide-up"
            style={{
              background: toast.type === "success" ? "var(--green-soft)" : "var(--red-soft)",
              border: `1px solid ${toast.type === "success" ? "rgba(34,197,94,0.4)" : "rgba(244,63,94,0.4)"}`,
              borderRadius: 12, padding: "12px 18px",
              color: toast.type === "success" ? "var(--green)" : "var(--red)",
              fontSize: 14, fontWeight: 600,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              maxWidth: 300,
            }}
          >
            {toast.type === "success" ? "✓ " : "✕ "}{toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
