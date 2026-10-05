module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "#71717a",
        border: "var(--border)",
        card: "var(--card)",
        success: "#16a34a",
        warning: "#d97706",
        danger: "#dc2626",
      },
      borderRadius: { xl: 16 },
    },
  },
  plugins: [],
};
