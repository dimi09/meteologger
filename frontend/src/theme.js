// ------------------------------------------------------------------
// Θέμα εμφάνισης (φωτεινό / σκοτεινό / αυτόματο από το σύστημα).
// Η επιλογή αποθηκεύεται στο localStorage ("ml_theme") και εφαρμόζεται
// ως class "dark" στο <html>. Τα χρώματα ορίζονται ως CSS variables
// στο main.scss και οι παρακάμψεις του Element UI στο dark.scss.
// ------------------------------------------------------------------
import Vue from "vue";

const KEY = "ml_theme";
const MODES = ["light", "dark", "system"];
const mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

function readMode() {
  try {
    const v = localStorage.getItem(KEY);
    return MODES.includes(v) ? v : "system";
  } catch (e) {
    return "system";
  }
}

export const theme = Vue.observable({ mode: readMode(), dark: false });

function apply() {
  theme.dark = theme.mode === "dark" || (theme.mode === "system" && !!(mq && mq.matches));
  const el = document.documentElement;
  el.classList.toggle("dark", theme.dark);
  el.style.colorScheme = theme.dark ? "dark" : "light";
}

export function setThemeMode(mode) {
  if (!MODES.includes(mode)) return;
  theme.mode = mode;
  try { localStorage.setItem(KEY, mode); } catch (e) { /* ignore */ }
  apply();
}

// Αν ο χρήστης έχει «Αυτόματο», ακολουθεί τις αλλαγές του λειτουργικού
if (mq) {
  const onChange = () => { if (theme.mode === "system") apply(); };
  if (mq.addEventListener) mq.addEventListener("change", onChange);
  else if (mq.addListener) mq.addListener(onChange);
}

apply();
