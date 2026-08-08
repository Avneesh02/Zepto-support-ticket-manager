/**
 * Dark Theme DecisionPanel Component - Sheryians Style
 * 
 * Features:
 * - Dark glassmorphic modal
 * - Smooth entrance animations
 * - Vibrant gradient backgrounds
 * - Premium typography
 * - Cool interactive effects
 * 
 * Backend Logic: UNCHANGED
 */

import { useState } from "react";
import ConfidenceBar from "./ConfidenceBar.jsx";
import PrecedentCard from "./PrecedentCard.jsx";

const ACTIONS = [
  "partial_refund",
  "full_refund",
  "refund_reissue",
  "redelivery",
  "coupon",
  "escalation",
  "apology_no_action",
];

export default function DecisionPanel({ decision, onClose, onOverride }) {
  const [overrideMode, setOverrideMode] = useState(false);
  const [chosenAction, setChosenAction] = useState(decision.action || ACTIONS[0]);
  const [overrideReason, setOverrideReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const needsHuman = decision.status === "needs_human";
  const resolved = decision.status === "human_resolved";

  async function submitOverride(action, reason) {
    setSubmitting(true);
    try {
      await onOverride(decision.ticket_id, action, reason);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md animate-fade-in" 
      onClick={onClose}
    >
      <div
        className="border-2 border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-scale-in"
        style={{
          background: "linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.9))",
          backdropFilter: "blur(30px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-8 animate-slide-down">
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
              {decision.ticket_id}
            </h2>
            <p className="text-base text-slate-300 mt-3 leading-relaxed font-semibold">{decision.description}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-500 hover:text-slate-300 text-3xl leading-none transition-all duration-300 font-light hover:rotate-90 hover:scale-110"
          >
            ×
          </button>
        </div>

        {/* Order context */}
        {decision.order_context && (
          <section className="mb-6 p-6 rounded-2xl border-2 border-slate-700 bg-gradient-to-br from-slate-900/50 to-slate-800/30 animate-slide-down-delay shadow-lg">
            <h3 className="text-xs uppercase tracking-widest text-slate-400 font-black mb-4">📦 Order Context</h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
              <span className="font-bold">Order ID: <span className="text-slate-100 font-black">{decision.order_context.order_id}</span></span>
              <span className="font-bold">Items: <span className="text-slate-100 font-black">{decision.order_context.items}</span></span>
              <span className="font-bold">Value: <span className="text-slate-100 font-black">₹{decision.order_context.value_inr}</span></span>
              <span className="font-bold">Delivery: <span className="text-slate-100 font-black">{decision.order_context.delivery_time_min} min</span></span>
              <span className="col-span-2 font-bold">
                Status:{" "}
                <span
                  className={
                    decision.order_context.delivery_status === "cancelled"
                      ? "text-red-400 font-black"
                      : "text-cyan-400 font-black"
                  }
                >
                  {decision.order_context.delivery_status}
                </span>
              </span>
            </div>
          </section>
        )}

        {/* Decision */}
        <section className="mb-6 p-6 rounded-2xl border-2 border-cyan-700/50 bg-gradient-to-br from-cyan-900/30 to-blue-900/20 animate-slide-down-delay-2 shadow-lg">
          <h3 className="text-xs uppercase tracking-widest text-cyan-400 font-black mb-4">⚡ Decision</h3>
          <div className="flex items-center justify-between mb-5">
            <span className="text-base text-slate-300 font-bold">
              Action:{" "}
              <span className="text-slate-100 font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {decision.action ? decision.action.replace(/_/g, " ") : "none suggested"}
              </span>
            </span>
            {decision.refund_amount != null && (
              <span className="text-base font-black text-cyan-400">₹{decision.refund_amount}</span>
            )}
          </div>
          <ConfidenceBar confidence={decision.confidence} status={decision.status} />
        </section>

        {/* Why this action */}
        <section className="mb-6 p-6 rounded-2xl border-2 border-amber-700/50 bg-gradient-to-br from-amber-900/30 to-orange-900/20 animate-slide-down-delay-3 shadow-lg">
          <h3 className="text-xs uppercase tracking-widest text-amber-400 font-black mb-4">💡 Why This Action?</h3>
          <ul className="space-y-3 text-sm text-slate-300">
            {decision.reason.map((r, i) => (
              <li key={i} className="flex gap-3 items-start animate-slide-down" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                <span className={`font-black text-lg flex-shrink-0 ${
                  r.toLowerCase().includes("conflict") || 
                  r.toLowerCase().includes("below") || 
                  r.toLowerCase().includes("exceed") || 
                  r.toLowerCase().includes("never") 
                    ? "text-purple-400" 
                    : "text-cyan-400"
                }`}>
                  {r.toLowerCase().includes("conflict") || 
                   r.toLowerCase().includes("below") || 
                   r.toLowerCase().includes("exceed") || 
                   r.toLowerCase().includes("never") 
                    ? "⚠" 
                    : "✓"}
                </span>
                <span className="font-semibold text-slate-200">{r}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Precedents */}
        <section className="mb-6 animate-slide-down-delay-4">
          <h3 className="text-xs uppercase tracking-widest text-slate-400 font-black mb-4">🏆 Top 3 Precedents</h3>
          <div className="space-y-3">
            {decision.precedents.map((p, i) => (
              <div key={p.ticket_id + i} style={{ animationDelay: `${0.4 + i * 0.1}s` }}>
                <PrecedentCard precedent={p} isTop={i === 0} />
              </div>
            ))}
          </div>
        </section>

        {/* Reply */}
        <section className="mb-6 p-6 rounded-2xl border-2 border-purple-700/50 bg-gradient-to-br from-purple-900/30 to-pink-900/20 animate-slide-down-delay-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs uppercase tracking-widest text-purple-400 font-black">
              💬 Customer Reply <span className="text-slate-500 font-normal">(simulated)</span>
            </h3>
            {decision.reply_source === "llm" ? (
              <span className="text-xs px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 border-2 border-cyan-500/50 font-black shadow-lg">
                ✨ AI-personalized
              </span>
            ) : (
              <span className="text-xs px-3 py-1.5 rounded-full bg-slate-700/50 text-slate-300 border-2 border-slate-600/50 font-black shadow-lg">
                Template
              </span>
            )}
          </div>
          <p className="text-base text-slate-200 leading-relaxed font-semibold">{decision.reply}</p>
        </section>

        {/* Human review controls */}
        {needsHuman && !resolved && (
          <section className="p-6 rounded-2xl border-2 border-purple-700/50 bg-gradient-to-br from-purple-900/30 to-pink-900/20 animate-slide-down-delay-6 shadow-lg">
            <h3 className="text-xs uppercase tracking-widest text-purple-400 font-black mb-4">👤 Human Review</h3>
            {!overrideMode ? (
              <div className="flex gap-3">
                <button
                  disabled={submitting || !decision.action}
                  onClick={() => submitOverride(decision.action, "Approved AI-suggested action")}
                  className="flex-1 py-3 rounded-xl bg-cyan-500/20 text-cyan-300 border-2 border-cyan-500/50 hover:bg-cyan-500/30 hover:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-black transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  ✓ Approve {decision.action ? decision.action.replace(/_/g, " ") : ""}
                </button>
                <button
                  onClick={() => setOverrideMode(true)}
                  className="flex-1 py-3 rounded-xl bg-slate-700/50 text-slate-300 border-2 border-slate-600/50 hover:bg-slate-700 hover:border-slate-600 text-sm font-black transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                >
                  ⚙ Override
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-scale-in">
                <select
                  value={chosenAction}
                  onChange={(e) => setChosenAction(e.target.value)}
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 font-bold focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 shadow-md"
                >
                  {ACTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Reason for override..."
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 font-bold focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 shadow-md"
                  rows={3}
                />
                <div className="flex gap-3">
                  <button
                    disabled={submitting || !overrideReason.trim()}
                    onClick={() => submitOverride(chosenAction, overrideReason)}
                    className="flex-1 py-3 rounded-xl bg-amber-500/20 text-amber-300 border-2 border-amber-500/50 hover:bg-amber-500/30 hover:border-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-black transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    ✓ Submit Override
                  </button>
                  <button
                    onClick={() => setOverrideMode(false)}
                    className="py-3 px-6 rounded-xl bg-slate-700/50 text-slate-300 border-2 border-slate-600/50 hover:bg-slate-700 hover:border-slate-600 text-sm font-bold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Resolved State */}
        {resolved && (
          <section className="p-6 rounded-2xl border-2 border-cyan-700/50 bg-gradient-to-br from-cyan-900/30 to-blue-900/20 text-sm font-black text-cyan-300 animate-scale-in shadow-lg">
            <span className="font-black text-lg">✓ Human-resolved:</span> {decision.human_action?.replace(/_/g, " ")} — {decision.override_reason}
          </section>
        )}
      </div>

      {/* Premium CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down-delay {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down-delay-2 {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down-delay-3 {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down-delay-4 {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down-delay-5 {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down-delay-6 {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.4s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.5s ease-out 0.05s both;
        }

        .animate-slide-down-delay {
          animation: slide-down-delay 0.5s ease-out 0.1s both;
        }

        .animate-slide-down-delay-2 {
          animation: slide-down-delay-2 0.5s ease-out 0.15s both;
        }

        .animate-slide-down-delay-3 {
          animation: slide-down-delay-3 0.5s ease-out 0.2s both;
        }

        .animate-slide-down-delay-4 {
          animation: slide-down-delay-4 0.5s ease-out 0.25s both;
        }

        .animate-slide-down-delay-5 {
          animation: slide-down-delay-5 0.5s ease-out 0.3s both;
        }

        .animate-slide-down-delay-6 {
          animation: slide-down-delay-6 0.5s ease-out 0.35s both;
        }
      `}</style>
    </div>
  );
}
