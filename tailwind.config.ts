import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        background: {
          DEFAULT: "#0A0A0A",
          secondary: "#111111",
        },
        // Surfaces
        surface: {
          DEFAULT: "#1A1A1A",
          hover: "#242424",
        },
        // Border
        border: {
          DEFAULT: "#2A2A2A",
        },
        // Accent (Rojo primario)
        accent: {
          DEFAULT: "#B91C1C",
          hover: "#991B1B",
          active: "#7F1D1D",
        },
        // Texto
        foreground: {
          DEFAULT: "#FAFAFA",
          secondary: "#A3A3A3",
          muted: "#737373",
          disabled: "#525252",
        },
        // Estados
        success: "#15803D",
        warning: "#D97706",
        error: "#DC2626",
        info: "#2563EB",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["3rem", { lineHeight: "1.1", fontWeight: "700" }],
        h1: ["2.25rem", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["1.875rem", { lineHeight: "1.25", fontWeight: "600" }],
        h3: ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        h4: ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        body: ["1rem", { lineHeight: "1.6" }],
        sm: ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.4" }],
      },
      spacing: {
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
        16: "64px",
        24: "96px",
      },
      borderRadius: {
        sm: "8px",
        DEFAULT: "12px",
        lg: "16px",
        xl: "24px",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
  },
}

export default config
