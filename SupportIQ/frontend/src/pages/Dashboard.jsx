/**
 * Dark Theme Dashboard Component - Sheryians Style
 * 
 * Features:
 * - Dark animated gradient background
 * - Smooth entrance animations
 * - Interactive hover effects
 * - Premium typography with gradients
 * - Cool interactive effects
 * 
 * Backend Logic: UNCHANGED
 */

import { useEffect, useMemo, useState } from "react";
import TicketCard from "../components/TicketCard.jsx";
import DecisionPanel from "../components/DecisionPanel.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Dashboard() {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    async function loadAll() {
      try {
        const ticketsRes = await fetch(`${API_URL}/tickets`);
        if (!ticketsRes.ok) throw new Error("Could not reach SupportIQ backend");
        const tickets = await ticketsRes.json();

        const resolved = await Promise.all(
          tickets.map((t) =>
            fetch(`${API_URL}/tickets/${t.ticket_id}/resolve`, { method: "POST" }).then((r) =>
              r.json()
            )
          )
        );
        setDecisions(resolved);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  const stats = useMemo(() => {
    const total = decisions.length;
    const auto = decisions.filter((d) => d.status === "auto_resolved").length;
    const human = decisions.filter((d) => d.status !== "auto_resolved").length;
    const avgConf = total
      ? (decisions.reduce((s, d) => s + (d.confidence || 0), 0) / total) * 100
      : 0;
    return { total, auto, human, avgConf };
  }, [decisions]);

  const autoLane = decisions.filter((d) => d.status === "auto_resolved");
  const humanLane = decisions.filter((d) => d.status !== "auto_resolved");
  const selected = decisions.find((d) => d.ticket_id === selectedId);

  async function handleOverride(ticketId, action, reason) {
    const res = await fetch(`${API_URL}/tickets/${ticketId}/override`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, reason }),
    });
    if (res.ok) {
      setDecisions((prev) =>
        prev.map((d) =>
          d.ticket_id === ticketId
            ? { ...d, status: "human_resolved", human_action: action, override_reason: reason }
            : d
        )
      );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        </div>
        <div className="text-center relative z-10">
          <div className="inline-block animate-spin mb-6">
            <div className="w-16 h-16 border-4 border-purple-900/50 border-t-purple-500 rounded-full"></div>
          </div>
          <p className="text-purple-300 font-black text-lg">Loading SupportIQ dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-4 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-red-500/15 to-transparent rounded-full blur-3xl"></div>
        </div>
        <div className="text-center max-w-md relative z-10">
          <div className="text-6xl mb-4 animate-bounce">⚠️</div>
          <p className="text-red-400 text-base font-black mb-3">{error}</p>
          <p className="text-purple-300 text-sm font-bold">Is the backend running at <span className="font-mono text-purple-400">{API_URL}</span>?</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-8 max-w-7xl mx-auto bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-purple-500/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-pink-500/20 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="mb-12 animate-slide-down">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 flex items-center justify-center shadow-2xl transform hover:scale-110 transition-transform duration-300">
              <span className="text-white font-black text-2xl">⚡</span>
            </div>
            <div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
                SupportIQ
              </h1>
              <p className="text-sm text-purple-400 font-bold mt-1">Evidence-Based AI Support Ticket Resolution</p>
            </div>
          </div>
          <p className="text-xs text-purple-500 mt-3 italic font-semibold">
            💡 All actions shown are simulated — no real refunds, redeliveries, or coupons are issued.
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard 
            label="Total Tickets" 
            value={stats.total} 
            color="from-purple-500 to-purple-600"
            icon="📊"
            delay="0s"
          />
          <StatCard 
            label="Auto-Resolved" 
            value={stats.auto} 
            color="from-cyan-500 to-blue-600"
            icon="✓"
            delay="0.1s"
          />
          <StatCard 
            label="Needs Human" 
            value={stats.human} 
            color="from-pink-500 to-purple-600"
            icon="👤"
            delay="0.2s"
          />
          <StatCard 
            label="Avg Confidence" 
            value={`${stats.avgConf.toFixed(0)}%`} 
            color="from-amber-500 to-orange-600"
            icon="🎯"
            delay="0.3s"
          />
        </div>

        {/* Lanes */}
        <div className="grid md:grid-cols-2 gap-8">
          <Lane 
            title="Auto-Resolved" 
            count={autoLane.length} 
            accentGradient="from-cyan-400 to-blue-500"
            borderColor="border-cyan-700/50"
            delay="0.1s"
          >
            {autoLane.map((d, i) => (
              <div key={d.ticket_id} style={{ animationDelay: `${0.1 + i * 0.05}s` }}>
                <TicketCard decision={d} onClick={() => setSelectedId(d.ticket_id)} />
              </div>
            ))}
            {autoLane.length === 0 && <EmptyState text="No tickets auto-resolved yet." />}
          </Lane>

          <Lane 
            title="Needs Human" 
            count={humanLane.length}
            accentGradient="from-purple-400 to-pink-500"
            borderColor="border-purple-700/50"
            delay="0.2s"
          >
            {humanLane.map((d, i) => (
              <div key={d.ticket_id} style={{ animationDelay: `${0.2 + i * 0.05}s` }}>
                <TicketCard decision={d} onClick={() => setSelectedId(d.ticket_id)} />
              </div>
            ))}
            {humanLane.length === 0 && <EmptyState text="Nothing needs human review." />}
          </Lane>
        </div>
      </div>

      {selected && (
        <DecisionPanel
          decision={selected}
          onClose={() => setSelectedId(null)}
          onOverride={handleOverride}
        />
      )}

      {/* Premium CSS Animations */}
      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-down {
          animation: slide-down 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value, color = "from-purple-500 to-purple-600", icon = "📈", delay = "0s" }) {
  return (
    <div 
      className="rounded-2xl border-2 border-slate-700 p-6 transition-all duration-500 hover:shadow-2xl hover:scale-110 hover:-translate-y-2 group cursor-pointer"
      style={{
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))",
        backdropFilter: "blur(20px)",
        animation: `slide-down 0.6s ease-out ${delay}`,
        animationFillMode: "both"
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-slate-400 font-black uppercase tracking-widest">{label}</p>
        <span className="text-2xl group-hover:scale-125 transition-transform duration-300">{icon}</span>
      </div>
      <p className={`text-4xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent transition-all duration-300`}>
        {value}
      </p>
    </div>
  );
}

function Lane({ title, count, accentGradient, borderColor, delay, children }) {
  return (
    <div 
      className="group"
      style={{
        animation: `slide-down 0.6s ease-out ${delay}`,
        animationFillMode: "both"
      }}
    >
      {/* Lane Header */}
      <div className={`flex items-center justify-between mb-6 pb-4 border-b-3 ${borderColor} transition-all duration-300`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 rounded-full bg-gradient-to-b ${accentGradient} shadow-lg`}></div>
          <h2 className="text-2xl font-black text-slate-200 uppercase tracking-wider">{title}</h2>
        </div>
        <span className={`text-lg font-black text-white bg-gradient-to-r ${accentGradient} px-4 py-2 rounded-full shadow-lg`}>
          {count}
        </span>
      </div>

      {/* Lane Content */}
      <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-700/50 scrollbar-track-transparent hover:scrollbar-thumb-purple-600/50">
        {children}
      </div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="py-16 text-center">
      <div className="text-5xl mb-4 animate-bounce">✨</div>
      <p className="text-slate-400 font-black text-base">{text}</p>
    </div>
  );
}
