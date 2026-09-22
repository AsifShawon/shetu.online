import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./types/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1440px"
      }
    },
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // EduWise design tokens (mirrors CSS custom properties for Tailwind usage)
        "ew-navy":       "#0B1F4D",
        "ew-navy-dark":  "#061640",
        "ew-navy-mid":   "#112B67",
        "ew-accent":     "#1E40AF",
        "ew-bg":         "#F4F6FB",
        "ew-card":       "#FFFFFF",
        "ew-text":       "#0F172A",
        "ew-muted":      "#64748B",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      boxShadow: {
        soft: "0 20px 45px -25px rgba(15, 23, 42, 0.35)",
        card: "0 1px 3px rgba(15, 23, 42, 0.06), 0 4px 16px rgba(15, 23, 42, 0.04)",
        drop: "0 8px 32px rgba(15, 23, 42, 0.14)",
      },
      backgroundImage: {
        mesh:
          "radial-gradient(circle at top left, rgba(14,116,144,0.18), transparent 36%), radial-gradient(circle at top right, rgba(217,119,6,0.18), transparent 28%), linear-gradient(135deg, rgba(248,250,252,1), rgba(241,245,249,1))"
      },
      transitionTimingFunction: {
        "ew-smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      }
    }
  },
  plugins: []
};

export default config;
