/**
 * Dark Theme ConfidenceBar Component - Sheryians Style
 * 
 * Features:
 * - Dark glassmorphic background
 * - Smooth entrance animations
 * - Vibrant gradient fills with shimmer effects
 * - Glowing shadows and depth effects
 * - Premium typography
 * 
 * Backend Logic: UNCHANGED
 */

export default function ConfidenceBar({ confidence, status }) {
  const pct = Math.round((confidence ?? 0) * 100);
  
  const colorConfig = {
    auto_resolved: {
      fill: "from-cyan-400 via-blue-400 to-cyan-500",
      glow: "shadow-[0_0_40px_rgba(34,211,238,0.8)]",
      text: "text-cyan-400",
      label: "✓ Auto-Resolved",
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
      bgGradient: "from-cyan-500/20 to-blue-500/10"
    },
    human_resolved: {
      fill: "from-amber-300 via-orange-400 to-amber-400",
      glow: "shadow-[0_0_40px_rgba(251,146,60,0.8)]",
      text: "text-amber-400",
      label: "✓ Human-Resolved",
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/50",
      bgGradient: "from-amber-500/20 to-orange-500/10"
    },
    human: {
      fill: "from-purple-400 via-pink-400 to-purple-500",
      glow: "shadow-[0_0_40px_rgba(168,85,247,0.8)]",
      text: "text-purple-400",
      label: "◆ Needs Review",
      badge: "bg-purple-500/20 text-purple-300 border-purple-500/50",
      bgGradient: "from-purple-500/20 to-pink-500/10"
    }
  };

  const config = colorConfig[status] || colorConfig.human;

  return (
    <div className="w-full animate-fade-in">
      {/* Header with Animation */}
      <div className="flex justify-between items-center mb-4 animate-slide-down">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-gradient-to-r from-slate-400 to-slate-500 bg-clip-text text-transparent">
          Confidence Level
        </span>
        <span className={`font-mono text-sm font-black ${config.text} animate-pulse-glow`}>
          {pct}%
        </span>
      </div>

      {/* Dark Glassmorphic Progress Container */}
      <div
        className={`relative w-full h-4 rounded-full overflow-hidden transition-all duration-500 ${config.glow} group hover:shadow-[0_0_50px_rgba(34,211,238,1)] cursor-pointer`}
        style={{
          background: "linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.95))",
          backdropFilter: "blur(20px)",
          border: "2px solid rgba(71, 85, 105, 0.5)",
          boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.5)"
        }}
      >
        {/* Animated Progress Fill */}
        <div
          className={`h-full rounded-full bg-gradient-to-r ${config.fill} transition-all duration-700 ease-out relative overflow-hidden group shadow-2xl`}
          style={{ 
            width: `${pct}%`,
            filter: "drop-shadow(0 0 20px rgba(34, 211, 238, 0.6))"
          }}
        >
          {/* Premium Shimmer Effect */}
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
              animation: "shimmer-premium 3s infinite",
              backgroundSize: "1000px 100%",
            }}
          />

          {/* Glow Pulse Inner */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              background: "radial-gradient(circle at center, rgba(255,255,255,0.3), transparent)",
              animation: "pulse-inner 2s ease-in-out infinite",
            }}
          />
        </div>

        {/* Background Gradient Overlay */}
        <div
          className={`absolute inset-0 rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-500 bg-gradient-to-r ${config.bgGradient}`}
          style={{
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Status Label with Badge Animation */}
      <div className="mt-4 flex items-center justify-between animate-slide-up">
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${config.badge} border shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}>
          {config.label}
        </span>
        <div className="flex gap-2">
          {pct >= 80 && (
            <span className="text-xs font-bold text-cyan-400 animate-bounce-subtle">
              ⚡ High Confidence
            </span>
          )}
          {pct >= 50 && pct < 80 && (
            <span className="text-xs font-bold text-amber-400 animate-fade-in-delay">
              → Medium Confidence
            </span>
          )}
          {pct < 50 && (
            <span className="text-xs font-bold text-purple-400 animate-pulse-glow">
              ⚠ Low Confidence
            </span>
          )}
        </div>
      </div>

      {/* Premium CSS Animations */}
      <style>{`
        @keyframes shimmer-premium {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes pulse-inner {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
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

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
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

        @keyframes fade-in-delay {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-slide-down {
          animation: slide-down 0.6s ease-out 0.1s both;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out 0.2s both;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        .animate-fade-in-delay {
          animation: fade-in-delay 0.8s ease-out 0.3s both;
        }
      `}</style>
    </div>
  );
}
