/**
 * Dark Theme PrecedentCard Component - Sheryians Style
 * 
 * Features:
 * - Dark glassmorphic container
 * - Smooth entrance animations
 * - Interactive hover effects
 * - Vibrant color-coded badges
 * - Premium typography
 * 
 * Backend Logic: UNCHANGED
 */

export default function PrecedentCard({ precedent, isTop }) {
  const getSimilarityStyle = () => {
    const similarity = precedent.similarity;
    if (similarity >= 0.8) return {
      text: "text-cyan-400 font-black",
      badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50",
      glow: "shadow-[0_0_30px_rgba(34,211,238,0.5)]"
    };
    if (similarity >= 0.6) return {
      text: "text-amber-400 font-black",
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/50",
      glow: "shadow-[0_0_30px_rgba(251,146,60,0.5)]"
    };
    return {
      text: "text-slate-400 font-bold",
      badge: "bg-slate-700/50 text-slate-300 border-slate-600/50",
      glow: "shadow-[0_0_20px_rgba(100,116,139,0.3)]"
    };
  };

  const getCSATStyle = () => {
    if (precedent.csat >= 4) return "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.4)]";
    if (precedent.csat >= 3) return "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_20px_rgba(251,146,60,0.4)]";
    return "bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.4)]";
  };

  const similarityStyle = getSimilarityStyle();

  return (
    <div
      className={`group rounded-2xl border p-5 transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1 relative overflow-hidden cursor-pointer animate-fade-in ${
        isTop 
          ? "border-amber-500/50 hover:shadow-[0_0_40px_rgba(251,146,60,0.5)]" 
          : "border-slate-700 hover:shadow-[0_0_40px_rgba(100,116,139,0.4)]"
      }`}
      style={{
        background: isTop
          ? "rgba(78, 35, 12, 0.3)"
          : "rgba(30, 41, 59, 0.6)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Animated Top Border */}
      {isTop && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 animate-shimmer-horizontal"></div>
      )}

      {/* Header: Ticket ID and Similarity */}
      <div className="flex items-center justify-between mb-4 animate-slide-down">
        <span className="text-xs font-mono text-slate-400 font-black tracking-widest">
          {precedent.ticket_id}
        </span>
        <div className="flex items-center gap-2">
          {isTop && (
            <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/60 font-bold animate-bounce-subtle shadow-lg">
              ⭐ Top Match
            </span>
          )}
          <span className={`text-xs font-mono ${similarityStyle.text} transition-all duration-300 ${similarityStyle.glow} px-3 py-1.5 rounded-full bg-slate-800/50 border border-current border-opacity-30`}>
            {(precedent.similarity * 100).toFixed(0)}% match
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-300 mb-4 group-hover:text-slate-200 transition-colors duration-300 relative z-10 font-semibold leading-relaxed animate-slide-down-delay">
        {precedent.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 text-xs mb-4 relative z-10 animate-slide-down-delay-2">
        {/* Category Tag */}
        <span className="px-3 py-1.5 rounded-full bg-slate-800/60 text-slate-300 border border-slate-700/60 hover:border-slate-600 transition-all duration-300 backdrop-blur-sm font-bold shadow-md hover:shadow-lg hover:scale-105">
          {precedent.category}
        </span>

        {/* Action Tag */}
        <span className="px-3 py-1.5 rounded-full bg-slate-800/60 text-slate-300 border border-slate-700/60 hover:border-slate-600 transition-all duration-300 backdrop-blur-sm font-bold shadow-md hover:shadow-lg hover:scale-105">
          {precedent.action.replace(/_/g, " ")}
        </span>

        {/* CSAT Tag with Vibrant Color Coding */}
        <span className={`px-3 py-1.5 rounded-full text-xs font-black transition-all duration-300 backdrop-blur-sm border ${getCSATStyle()} hover:scale-105`}>
          CSAT {precedent.csat}/5
        </span>
      </div>

      {/* Resolution Note */}
      <p className="text-xs text-slate-400 italic group-hover:text-slate-300 transition-colors duration-300 relative z-10 leading-relaxed border-l-4 border-slate-700 pl-4 py-2 bg-slate-900/30 rounded-r-lg animate-slide-up">
        "{precedent.resolution_note}"
      </p>

      {/* Hover Gradient Overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none rounded-2xl"
        style={{
          background: isTop
            ? "linear-gradient(135deg, rgba(251, 146, 60, 0.3), transparent)"
            : "linear-gradient(135deg, rgba(34, 211, 238, 0.15), transparent)",
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

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(8px);
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

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        @keyframes shimmer-horizontal {
          0% {
            background-position: -100% 0;
          }
          100% {
            background-position: 100% 0;
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

        .animate-slide-up {
          animation: slide-up 0.5s ease-out 0.2s both;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }

        .animate-shimmer-horizontal {
          animation: shimmer-horizontal 3s infinite;
          background-size: 200% 100%;
        }
      `}</style>
    </div>
  );
}
