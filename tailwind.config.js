/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: "#FFFFFF",
        surface: "#F9FAFB",
        charcoal: "#111827",
        slateMuted: "#6B7280",
        primaryTeal: "#0F766E",
        accentTeal: "#14B8A6",
        crimsonAlert: "#DC2626",
        emeraldVerified: "#16A34A"
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: []
};
