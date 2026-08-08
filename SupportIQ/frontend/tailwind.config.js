/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        surface: "#0b1220",
        panel: "#111a2e",
        border: "#1e293b",
        accent: "#38bdf8",
        auto: "#22c55e",
        human: "#f59e0b",
        blocked: "#ef4444",
      },
    },
  },
  plugins: [],
};
