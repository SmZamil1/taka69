const STORAGE_KEY = "taka69_theme";

export function getThemeBootstrapScript() {
  return `(() => { try { const key = "${STORAGE_KEY}"; const saved = localStorage.getItem(key); const theme = saved === "light" || saved === "dark" || saved === "auto" ? saved : "auto"; const root = document.documentElement; root.dataset.theme = theme; root.classList.add("theme-" + theme); } catch (_) {} })()`;
}
