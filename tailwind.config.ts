import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "var(--surface-base)",
          raised: "var(--surface-raised)"
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)"
        },
        border: {
          default: "var(--border-default)"
        },
        accent: {
          default: "var(--accent-default)",
          subtle: "var(--accent-subtle)"
        },
        focus: {
          ring: "var(--focus-ring)"
        },
        status: {
          waiting: "var(--status-waiting)",
          called: "var(--status-called)",
          "in-room": "var(--status-in-room)"
        }
      },
      boxShadow: {
        focus: "0 0 0 3px var(--focus-ring)"
      }
    }
  },
  plugins: []
};

export default config;
