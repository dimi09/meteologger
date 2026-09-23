// Preload (sandbox): εκθέτει ελάχιστο, ασφαλές API στις σελίδες.
const { contextBridge, ipcRenderer } = require("electron");

// Για το web app: ξέρει ότι τρέχει μέσα στη desktop εφαρμογή
// (π.χ. για να κρύψει το κουμπί «Λήψη desktop εφαρμογής»).
contextBridge.exposeInMainWorld("meteologgerDesktop", {
  isDesktop: true,
  getVersion: () => ipcRenderer.invoke("app:version")
});

// Για την τοπική σελίδα ανακάλυψης server (ο main process δέχεται
// αυτά τα μηνύματα μόνο από file://).
if (location.protocol === "file:") {
  contextBridge.exposeInMainWorld("discoveryApi", {
    onState: (cb) => ipcRenderer.on("discovery:state", (_e, state) => cb(state)),
    choose: (server) => ipcRenderer.send("discovery:choose", server),
    retry: () => ipcRenderer.send("discovery:retry"),
    manual: (input) => ipcRenderer.send("discovery:manual", input)
  });
}
