/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#fff5f6",
          100: "#ffe0e4",
          200: "#ffc7ce",
          300: "#ff9da9",
          400: "#f56b7e",
          500: "#e03e55",    // vivid crimson — was #b14d55 (dusty)
          600: "#c22d45",
          700: "#a3253c",
          800: "#882036",
          900: "#6b1a2e"
        },
        accent: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b"
        },
        ink:   "#181d27",     // deeper for better contrast — was #1f2530
        muted: "#5c6478"      // slightly darker for readability — was #697184
      },
      fontFamily: {
        sans: ["Manrope", "sans-serif"],
        serif: ["DM Serif Display", "serif"]
      },
      boxShadow: {
        soft:    "0 4px 24px rgba(30, 20, 40, 0.06), 0 24px 80px rgba(100, 40, 50, 0.10)",
        "soft-lg": "0 8px 40px rgba(30, 20, 40, 0.08), 0 32px 100px rgba(100, 40, 50, 0.14)",
        glow:    "0 0 24px rgba(224, 62, 85, 0.18), 0 0 60px rgba(224, 62, 85, 0.08)",
        "card-hover": "0 12px 48px rgba(30, 20, 40, 0.10), 0 40px 100px rgba(100, 40, 50, 0.16)"
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #c22d45 0%, #e03e55 45%, #f07058 100%)",
        "brand-gradient-vivid":
          "linear-gradient(135deg, #a3253c 0%, #e03e55 50%, #f59e0b 100%)",
        "brand-gradient-subtle":
          "linear-gradient(135deg, rgba(224,62,85,0.06) 0%, rgba(245,158,11,0.04) 100%)"
      },
      animation: {
        "shimmer": "shimmer 2.5s ease-in-out infinite",
        "float":   "float 6s ease-in-out infinite"
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.7" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-8px)" }
        }
      }
    }
  },
  plugins: []
};
