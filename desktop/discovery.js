// Αυτόματη ανακάλυψη MeteoLogger servers στο LAN μέσω mDNS / DNS-SD.
// Ο server (service "mdns" στο compose) ανακοινώνει την υπηρεσία _meteologger._tcp.
const { Bonjour } = require("bonjour-service");

const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * Ψάχνει servers για `timeoutMs` και επιστρέφει λίστα:
 *   [{ key, name, host, ip, webPort }]
 */
function discover(timeoutMs = 4000) {
  return new Promise((resolve) => {
    const found = new Map();
    let bonjour;
    try {
      bonjour = new Bonjour({}, (err) => console.warn("[discovery] mDNS error:", err && err.message));
    } catch (err) {
      console.warn("[discovery] αδυναμία εκκίνησης mDNS:", err.message);
      return resolve([]);
    }

    const browser = bonjour.find({ type: "meteologger", protocol: "tcp" }, (s) => {
      const host = (s.host || "").replace(/\.$/, "");                 // π.χ. meteo-lab.local
      const ip = (s.addresses || []).find((a) => IPV4.test(a))
        || (s.referer && IPV4.test(s.referer.address) ? s.referer.address : "");
      if (!host && !ip) return;
      const webPort = Number((s.txt && s.txt.web) || 80);
      const key = host || ip;
      found.set(key, { key, name: s.name || key, host, ip, webPort });
    });

    setTimeout(() => {
      try { browser.stop(); } catch (_) { /* ignore */ }
      try { bonjour.destroy(); } catch (_) { /* ignore */ }
      resolve([...found.values()]);
    }, timeoutMs);
  });
}

module.exports = { discover };
