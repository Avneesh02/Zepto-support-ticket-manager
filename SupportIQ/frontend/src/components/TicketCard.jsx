/**
 * Dark Theme TicketCard Component - Sheryians Style
 * 
 * Features:
 * - Dark glassmorphic container
 * - Smooth entrance animations
 * - Interactive hover effects with scale and glow
 * - Vibrant gradient accents
 * - Premium typography
 * 
 * Backend Logic: UNCHANGED
 */

import ConfidenceBar from "./ConfidenceBar.jsx";

const STATUS_STYLES = {
  auto_resolved: { 
    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50", 
    label: "Auto-Resolved",
    glow: "hover:shadow-[0_0_40px_rgba(34,211,238,0.6)]",
    hoverBg: "rgba(34, 211, 238, 0.1)",
    accentGradient: "from-cyan-400 to-blue-500"
  },
  needs_human: { 
    badge: "bg-purple-500/20 text-purple-300 border-purple-500/50", 
    label: "Needs Human",
    glow: "hover:shadow-[0_0_40px_rgba(168,85,247,0.6)]",
    hoverBg: "rgba(168, 85, 247, 0.1)",
    accentGradient: "from-purple-400 to-pink-500"
  },
  human_resolved: { 
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/50", 
    label: "Human-Resolved",
    glow: "hover:shadow-[0_0_40px_rgba(251,146,60,0.6)]",
    hoverBg: "rgba(251, 146, 60, 0.1)",
    accentGradient: "from-amber-400 to-orange-500"
  },
};

export default function TicketCard({ decision, onClick }) {
  const style = STATUS_STYLES[decision.status] ?? STATUS_STYLES.needs_human;
  const blocked = decision.guardrails_passed === false;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl border transition-all duration-500 p-5 group relative overflow-hidden ${
        blocked 
          ? "border-red-500/50 hover:border-red-500 hover:shadow-[0_0_40px_rgba(239,68,68,0.5)]" 
          : `border-slate-700 hover:border-slate-600 ${style.glow}`
      } hover:scale-[1.02] hover:-translate-y-1 cursor-pointer animate-fade-in`}
      style={{
        background: blocked 
          ? "rgba(127, 29, 29, 0.2)"
          : "rgba(30, 41, 59, 0.6)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Glassmorphic Background Overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: blocked
            ? "linear-gradient(135deg, rgba(127, 29, 29, 0.3), transparent)"
            : `linear-gradient(135deg, ${style.hoverBg}, transparent)`,
        }}
      />

      {/* Animated Border Accent */}
      <div
        className={`absolute top-0 left-0 h-1 bg-gradient-to-r ${style.accentGradient} transition-all duration-500 group-hover:h-2`}
        style={{
          width: `${Math.round((decision.confidence ?? 0) * 100)}%`,
        }}
      />

      {/* Content Container */}
      <div className="relative z-10">
        {/* Header: Ticket ID and Status Badge */}
        <div className="flex items-start justify-between mb-4 animate-slide-down">
          <span className="text-xs font-mono text-slate-400 font-bold tracking-widest">
            {decision.ticket_id}
          </span>
          <div className="flex items-center gap-2">
            {blocked && (
              <span className="text-xs px-3 py-1.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/50 font-bold animate-pulse-glow flex items-center gap-1 shadow-lg">
                ⚠ Blocked
              </span>
            )}
            <span
              className={`text-[11px] px-3 py-1.5 rounded-full border font-bold transition-all duration-300 shadow-lg hover:shadow-xl ${style.badge}`}
            >
              {style.label}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-300 mb-4 line-clamp-2 group-hover:text-slate-200 transition-colors duration-300 leading-relaxed font-semibold animate-slide-down-delay">
          {decision.description}
        </p>

        {/* Action and Status Row */}
        <div className="flex items-center justify-between mb-5 text-xs animate-slide-down-delay-2">
          <span className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300 font-medium">
            Action:{" "}
            <span className="text-slate-200 font-bold group-hover:text-slate-100 transition-colors duration-300">
              {decision.action ? decision.action.replace(/_/g, " ") : "—"}
            </span>
          </span>
          {blocked && (
            <span className="text-red-400 font-bold text-xs animate-pulse-glow">
              Review Required
            </span>
          )}
        </div>

        {/* Confidence Bar */}
        <ConfidenceBar confidence={decision.confidence} status={decision.status} />
      </div>

      {/* Animated Glow Border */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none"
        style={{
          background: blocked
            ? "radial-gradient(circle at top right, rgba(239, 68, 68, 0.4), transparent)"
            : `radial-gradient(circle at top right, ${style.hoverBg}, transparent)`,
        }}
      />

      {/* Premium CSS Animations */}
      <style>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down-delay {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-down-delay-2 {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            filter: drop-shadow(0 0 0px currentColor);
          }
          50% {
            opacity: 0.7;
            filter: drop-shadow(0 0 8px currentColor);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
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

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>
    </button>
  );
}
