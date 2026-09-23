// ------------------------------------------------------------------
// MeteoLogger Desktop
//
// Λεπτό "κέλυφος" γύρω από το web app του server:
//  1. Βρίσκει αυτόματα τον server στο LAN (mDNS, _meteologger._tcp).
//  2. Φορτώνει το frontend απευθείας από τον server (άρα κάθε αλλαγή στο
//     frontend φτάνει αμέσως, χωρίς νέο installer).
//  3. Ελέγχει για νέα έκδοση της ίδιας της desktop εφαρμογής στο
//     http://<server>/desktop/ και την εγκαθιστά μετά από επιβεβαίωση.
// ------------------------------------------------------------------
const { app, BrowserWindow, Menu, dialog, ipcMain, net, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { autoUpdater } = require("electron-updater");
const { discover } = require("./discovery");

const DISCOVERY_MS = 4000;
const HEALTH_TIMEOUT_MS = 2500;
const UPDATE_CHECK_EVERY_MS = 60 * 60 * 1000; // κάθε 1 ώρα

let win = null;
let currentBase = null;   // π.χ. "http://meteo-lab.local/"
let updateTimer = null;
let manualUpdateCheck = false;

// ---------------- ρυθμίσεις (τελευταίος server) ----------------
const configPath = () => path.join(app.getPath("userData"), "config.json");
function loadConfig() {
  try { return JSON.parse(fs.readFileSync(configPath(), "utf8")); } catch (_) { return {}; }
}
function saveConfig(cfg) {
  try { fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2)); } catch (e) { console.warn(e); }
}

// ---------------- βοηθητικά ----------------
function baseFor(hostOrIp, port) {
  return `http://${hostOrIp}${Number(port) === 80 ? "" : ":" + port}/`;
}

function normalizeManual(input) {
  let s = String(input || "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "http://" + s;
  try {
    const u = new URL(s);
    return `${u.protocol}//${u.host}/`;
  } catch (_) {
    return null;
  }
}

async function isAlive(base) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), HEALTH_TIMEOUT_MS);
  try {
    const res = await net.fetch(base + "api/health", { signal: ctrl.signal, cache: "no-store" });
    return res.ok;
  } catch (_) {
    return false;
  } finally {
    clearTimeout(t);
  }
}

// Προτιμά το όνομα (<host>.local, σταθερό origin => μένεις συνδεδεμένος),
// αλλιώς την IP (αν τα Windows δεν επιλύουν .local).
async function resolveBase(server) {
  if (server.host) {
    const b = baseFor(server.host, server.webPort);
    if (await isAlive(b)) return b;
  }
  if (server.ip) {
    const b = baseFor(server.ip, server.webPort);
    if (await isAlive(b)) return b;
  }
  return null;
}

// ---------------- UI ανακάλυψης ----------------
function sendState(state) {
  if (win && !win.isDestroyed()) win.webContents.send("discovery:state", state);
}

async function showDiscovery({ forceChoose = false } = {}) {
  currentBase = null;
  await win.loadFile(path.join(__dirname, "ui", "discover.html"));
  runDiscovery({ forceChoose });
}

async function runDiscovery({ forceChoose = false } = {}) {
  const cfg = loadConfig();
  sendState({ phase: "searching" });

  const servers = await discover(DISCOVERY_MS);

  if (!forceChoose) {
    // 1) ο server που χρησιμοποιήθηκε την τελευταία φορά
    const last = cfg.lastServer && servers.find((s) => s.key === cfg.lastServer.key);
    if (last) return connect(last);
    // 2) ακριβώς ένας server στο δίκτυο
    if (servers.length === 1) return connect(servers[0]);
    // 3) κανένας: δοκίμασε τη χειροκίνητη διεύθυνση που είχε δοθεί
    if (servers.length === 0 && cfg.manualBase && (await isAlive(cfg.manualBase))) {
      return openBase(cfg.manualBase);
    }
  }

  sendState({
    phase: servers.length ? "choose" : "notfound",
    servers,
    manual: cfg.manualBase || ""
  });
}

async function connect(server) {
  sendState({ phase: "connecting", name: server.name });
  const base = await resolveBase(server);
  if (!base) {
    sendState({ phase: "error", message: `Ο server «${server.name}» βρέθηκε αλλά δεν απαντά.` });
    return;
  }
  const cfg = loadConfig();
  cfg.lastServer = server;
  saveConfig(cfg);
  openBase(base);
}

function openBase(base) {
  currentBase = base;
  win.loadURL(base);
  setupUpdater(base);
}

// Τα IPC της σελίδας ανακάλυψης δέχονται μόνο από την τοπική σελίδα (file://),
// ποτέ από το απομακρυσμένο web app.
function fromLocalPage(event) {
  const url = (event.senderFrame && event.senderFrame.url) || "";
  return url.startsWith("file://");
}

ipcMain.on("discovery:choose", (event, server) => {
  if (fromLocalPage(event) && server) connect(server);
});
ipcMain.on("discovery:retry", (event) => {
  if (fromLocalPage(event)) runDiscovery({ forceChoose: true });
});
ipcMain.on("discovery:manual", async (event, input) => {
  if (!fromLocalPage(event)) return;
  const base = normalizeManual(input);
  if (!base) return sendState({ phase: "error", message: "Μη έγκυρη διεύθυνση." });
  sendState({ phase: "connecting", name: base });
  if (!(await isAlive(base))) {
    return sendState({ phase: "error", message: `Δεν απαντά server MeteoLogger στο ${base}` });
  }
  const cfg = loadConfig();
  cfg.manualBase = base;
  delete cfg.lastServer;
  saveConfig(cfg);
  openBase(base);
});
ipcMain.handle("app:version", () => app.getVersion());

// ---------------- auto-update ----------------
function setupUpdater(base) {
  if (!app.isPackaged) return; // σε `npm start` δεν υπάρχει installer για update
  autoUpdater.setFeedURL({ provider: "generic", url: base + "desktop/" });
  checkForUpdates(false);
  if (updateTimer) clearInterval(updateTimer);
  updateTimer = setInterval(() => checkForUpdates(false), UPDATE_CHECK_EVERY_MS);
}

function checkForUpdates(manual) {
  if (!app.isPackaged) {
    if (manual) dialog.showMessageBox(win, { message: "Οι ενημερώσεις λειτουργούν μόνο στην εγκατεστημένη εφαρμογή." });
    return;
  }
  if (!currentBase) {
    if (manual) dialog.showMessageBox(win, { message: "Συνδέσου πρώτα σε server." });
    return;
  }
  manualUpdateCheck = manual;
  autoUpdater.checkForUpdates().catch((e) => {
    if (manual) dialog.showMessageBox(win, { type: "error", message: "Αποτυχία ελέγχου ενημερώσεων.", detail: e.message });
  });
}

autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.logger = console;

autoUpdater.on("update-available", async (info) => {
  const { response } = await dialog.showMessageBox(win, {
    type: "info",
    title: "Νέα έκδοση",
    message: `Υπάρχει νέα έκδοση του MeteoLogger (${info.version}).`,
    detail: `Τρέχουσα έκδοση: ${app.getVersion()}\nΘέλεις να γίνει λήψη και εγκατάσταση τώρα;`,
    buttons: ["Ενημέρωση", "Αργότερα"],
    defaultId: 0,
    cancelId: 1
  });
  if (response === 0) autoUpdater.downloadUpdate();
});

autoUpdater.on("update-not-available", () => {
  if (manualUpdateCheck) {
    dialog.showMessageBox(win, { message: `Έχεις την τελευταία έκδοση (${app.getVersion()}).` });
  }
});

autoUpdater.on("download-progress", (p) => {
  if (win) win.setProgressBar(p.percent / 100);
});

autoUpdater.on("update-downloaded", async (info) => {
  if (win) win.setProgressBar(-1);
  const { response } = await dialog.showMessageBox(win, {
    type: "info",
    title: "Η ενημέρωση είναι έτοιμη",
    message: `Η έκδοση ${info.version} κατέβηκε.`,
    detail: "Η εφαρμογή θα κλείσει, θα εγκατασταθεί η νέα έκδοση και θα ανοίξει ξανά.",
    buttons: ["Επανεκκίνηση τώρα", "Στο επόμενο κλείσιμο"],
    defaultId: 0,
    cancelId: 1
  });
  if (response === 0) autoUpdater.quitAndInstall(true, true);
});

autoUpdater.on("error", (e) => {
  if (win) win.setProgressBar(-1);
  console.warn("[updater]", e && e.message);
  if (manualUpdateCheck) {
    dialog.showMessageBox(win, { type: "error", message: "Σφάλμα ενημέρωσης.", detail: e && e.message });
  }
});

// ---------------- μενού ----------------
function buildMenu() {
  const template = [
    {
      label: "Εφαρμογή",
      submenu: [
        { label: "Αλλαγή server…", click: () => showDiscovery({ forceChoose: true }) },
        { label: "Έλεγχος για ενημερώσεις…", click: () => checkForUpdates(true) },
        { type: "separator" },
        { label: "Ανανέωση", accelerator: "F5", click: () => win && win.webContents.reload() },
        { label: "Πλήρης οθόνη", role: "togglefullscreen" },
        { label: "Εργαλεία προγραμματιστή", accelerator: "Ctrl+Shift+I", role: "toggleDevTools" },
        { type: "separator" },
        { label: `Έκδοση ${app.getVersion()}`, enabled: false },
        { label: "Έξοδος", role: "quit" }
      ]
    },
    {
      label: "Επεξεργασία",
      submenu: [
        { label: "Αναίρεση", role: "undo" },
        { label: "Επανάληψη", role: "redo" },
        { type: "separator" },
        { label: "Αποκοπή", role: "cut" },
        { label: "Αντιγραφή", role: "copy" },
        { label: "Επικόλληση", role: "paste" },
        { label: "Επιλογή όλων", role: "selectAll" }
      ]
    },
    {
      label: "Προβολή",
      submenu: [
        { label: "Μεγέθυνση", role: "zoomIn" },
        { label: "Σμίκρυνση", role: "zoomOut" },
        { label: "Κανονικό μέγεθος", role: "resetZoom" }
      ]
    }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---------------- παράθυρο ----------------
function sameServerHost(url) {
  try {
    return currentBase && new URL(url).hostname === new URL(currentBase).hostname;
  } catch (_) {
    return false;
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 650,
    title: "MeteoLogger",
    icon: path.join(__dirname, "build", "icon.png"),
    backgroundColor: "#ffffff",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  // Νέα παράθυρα (π.χ. «Άνοιγμα Grafana σε νέα καρτέλα") -> στον browser του συστήματος
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  // Πλοήγηση εκτός του server -> στον browser του συστήματος
  win.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("file://") || sameServerHost(url)) return;
    event.preventDefault();
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
  });

  // Αν ο server πέσει / αλλάξει δίκτυο -> πίσω στην αναζήτηση
  win.webContents.on("did-fail-load", (_e, code, _desc, url, isMainFrame) => {
    if (isMainFrame && currentBase && code !== -3 /* ABORTED */ && url.startsWith(currentBase)) {
      showDiscovery();
    }
  });

  showDiscovery();
}

// Μία μόνο ανοιχτή εφαρμογή
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    app.setAppUserModelId("gr.uniwa.meteologger");
    buildMenu();
    createWindow();
  });

  app.on("window-all-closed", () => app.quit());
}
