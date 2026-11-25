const v = (n) => `rgb(var(--${n}) / <alpha-value>)`;
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  safelist: ["text-safe", "text-warn", "text-danger", "bg-safe", "bg-warn", "bg-danger"],
  theme: {
    extend: {
      colors: { bg: v("bg"), surface: v("surface"), sunk: v("sunk"), ink: v("ink"), muted: v("muted"), line: v("line"), accent: v("accent"), "accent-ink": v("accent-ink"),
        safe: v("safe"), "safe-bg": v("safe-bg"), warn: v("warn"), "warn-bg": v("warn-bg"), danger: v("danger"), "danger-bg": v("danger-bg") },
      fontFamily: { display: ["Literata", "Georgia", "serif"], body: ["'Atkinson Hyperlegible'", "system-ui", "sans-serif"], mono: ["'JetBrains Mono'", "ui-monospace", "monospace"] },
    },
  },
};
