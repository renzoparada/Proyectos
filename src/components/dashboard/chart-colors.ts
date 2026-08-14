// Maps our existing status tones to the CSS custom properties defined in
// globals.css, so charts reuse the exact same semantic colors as badges
// elsewhere in the app (a project in "En pausa" is the same amber everywhere).
export const TONE_COLOR: Record<"neutral" | "accent" | "success" | "warning" | "danger", string> = {
  neutral: "var(--muted)",
  accent: "var(--accent)",
  success: "var(--success)",
  warning: "var(--warning)",
  danger: "var(--danger)",
};
