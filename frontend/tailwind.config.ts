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
        // Shetu brand design tokens
        shetu: {
          green: {
            950: "#02351F",
            900: "#03462A",
            800: "#045330",
            700: "#09643C",
            600: "#13764A",
            500: "#1B8A57",
            100: "#DDEFE5",
            50:  "#F1F8F4",
          },
          red: {
            DEFAULT: "#EB0310",
            dark: "#C8000C",
            soft: "#FDE9EA",
          },
          ink: "#14231B",
          text: "#28362F",
          muted: "#64736B",
          border: "#DCE6E0",
          surface: "#F7FAF8",
          white: "#FFFFFF",
        },
        // Shetu-mapped dashboard tokens
        "ew-navy":       "#03462A",
        "ew-navy-dark":  "#02351F",
        "ew-navy-mid":   "#045330",
        "ew-accent":     "#09643C",
        "ew-bg":         "#F4F8F5",
        "ew-card":       "#FFFFFF",
        "ew-text":       "#14231B",
        "ew-muted":      "#64736B",
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
