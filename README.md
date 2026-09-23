# MeteoLogger

Πλατφόρμα συλλογής, αποθήκευσης και παρακολούθησης μετρήσεων μετεωρολογικού σταθμού DAVIS.
Backend (FastAPI) + Admin (Vue2/ElementUI) + PostgreSQL + Grafana + Adminer + αυτόματα backups,
όλα μέσω Docker Compose πίσω από reverse proxy, με αυτόματη ανακάλυψη στο LAN (mDNS).

## Γρήγορη εκκίνηση

```bash
cp .env.example .env      # άλλαξε κωδικούς/SECRET_KEY
docker compose build
docker compose up -d
docker compose ps
```

### Πρόσβαση από το LAN (plug-and-play, χωρίς αρχείο hosts)

Το service `mdns` (Avahi) ανακοινώνει αυτόματα τον server στο τοπικό δίκτυο ως
**`<hostname-του-server>.local`**. Δεν χρειάζεται IP, ούτε εγγραφές στο
`C:\Windows\System32\drivers\etc\hosts` των clients.

Π.χ. αν ο Linux server λέγεται `meteo-lab`:

- Διαχειριστικό: http://meteo-lab.local
- Grafana:       http://meteo-lab.local:3000
- Adminer:       http://meteo-lab.local:8080
- API / Swagger: http://meteo-lab.local:8000/docs

Όλα δουλεύουν και με την IP του server ή με `localhost` (τίποτα δεν είναι hardcoded).
Το frontend καλεί το API σχετικά (`/api`) και το Grafana στο ίδιο host, θύρα 3000.

Το hostname του server φαίνεται / αλλάζει με:

```bash
hostnamectl                               # τρέχον όνομα
sudo hostnamectl set-hostname meteo-lab   # μοναδικό όνομα στο δίκτυο
```

Για σταθερό όνομα ανεξάρτητα από το hostname: `MDNS_HOSTNAME=meteologger` στο `.env`.

Σημειώσεις:

- Το `mdns` χρησιμοποιεί `network_mode: host`, άρα λειτουργεί σε **Linux server**
  (όχι σε Docker Desktop Windows/Mac).
- Αν ο server έχει ήδη `avahi-daemon` (π.χ. Ubuntu Desktop), απενεργοποίησέ τον για
  να μη συγκρούεται με το container:
  `sudo systemctl disable --now avahi-daemon.socket avahi-daemon.service`
- Windows clients: το δίκτυο πρέπει να είναι «Ιδιωτικό» (Private), αλλιώς το firewall
  μπλοκάρει το mDNS (UDP 5353).
- Αν δύο συσκευές έχουν το ίδιο όνομα, το Avahi προσθέτει `-2` (βλ. `docker compose logs mdns`).
- Εκτός από το όνομα, ανακοινώνεται και υπηρεσία `_meteologger._tcp` (θύρα 8000) για
  αυτόματη ανακάλυψη από desktop clients (π.χ. Electron).

### Dev (`docker-compose.dev.yaml`)

- Εφαρμογή: http://localhost:8081
- Swagger:  http://localhost:8000/docs
- Grafana:  http://localhost:3000
- Adminer:  http://localhost:8080

## Desktop εφαρμογή (Windows)

Ο φάκελος `desktop/` περιέχει μια Electron εφαρμογή που:

- **βρίσκει μόνη της τον server** στο LAN (mDNS, υπηρεσία `_meteologger._tcp`).
  Αν βρει πολλούς, δείχνει λίστα· αν δεν βρει κανέναν, δέχεται χειροκίνητα όνομα/IP.
- **φορτώνει το web app από τον server**, άρα κάθε αλλαγή στο frontend φτάνει
  στους χρήστες αμέσως, χωρίς νέο installer.
- **ενημερώνεται μόνη της**: ελέγχει το `http://<server>/desktop/` στην εκκίνηση
  και κάθε 1 ώρα, ρωτά τον χρήστη και εγκαθιστά τη νέα έκδοση.

### Build & δημοσίευση νέας έκδοσης (στον server)

```bash
git pull
# 1. αύξησε το version στο desktop/package.json (π.χ. 1.0.0 -> 1.0.1)
# 2. χτίσε τον installer (Windows .exe μέσω Docker, δεν χρειάζεται Windows/Node)
docker compose --profile desktop run --rm desktop-build
```

Τα αρχεία μπαίνουν στο `${MEASURELOG_DATA_DIR}/desktop/` και σερβίρονται από τον
Nginx στο `http://<server>/desktop/`. Οι εγκατεστημένες εφαρμογές βλέπουν την
ενημέρωση αυτόματα. **Χωρίς αύξηση του version δεν εμφανίζεται ενημέρωση.**

### Πρώτη εγκατάσταση

Από το web app: κουμπί **«Desktop εφαρμογή»** πάνω δεξιά (εμφανίζεται μόλις
υπάρξει build) → κατεβάζει το `MeteoLogger-Setup-x.y.z.exe`.

- Ο installer δεν είναι ψηφιακά υπογεγραμμένος: στο μήνυμα των Windows
  «Τα Windows προστάτεψαν τον υπολογιστή σας» → «Περισσότερες πληροφορίες» → «Εκτέλεση».
- Στην πρώτη εκκίνηση μπορεί να εμφανιστεί το Τείχος προστασίας: επίτρεψε
  την πρόσβαση σε **Ιδιωτικά δίκτυα** (χρειάζεται για την αυτόματη εύρεση server).
- Μενού «Εφαρμογή»: αλλαγή server, χειροκίνητος έλεγχος ενημερώσεων.

### Development (στα Windows)

```bash
cd desktop
npm install
npm start          # τρέχει την εφαρμογή (χωρίς auto-update)
npm run dist       # χτίζει τοπικά τον installer στο desktop/dist/
```

## Είσοδος διαχειριστικού

Τα credentials από το `.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).

## Δομή

```text
meteologger/
├── compose.yaml
├── .env / .env.example
├── backend/        FastAPI (auth, import excel/csv, files, backups, summary)
├── frontend/       Vue2 + ElementUI + Vuex + Axios (admin)
├── nginx/          reverse proxy (θύρες 80 / 3000 / 8080)
├── mdns/           Avahi: ανακοίνωση <hostname>.local στο LAN
├── desktop/        Electron desktop εφαρμογή (auto-discovery + auto-update)
├── grafana/        provisioning + dashboard
└── backup/         καθημερινό pg_dump (retention 7 ημερών)
```

## Αποθήκευση αρχείων

Τα ανεβασμένα αρχεία και τα backups ζουν **εκτός** των containers, στο `MEASURELOG_DATA_DIR`:
- τοπικά: `./storage`
- Ubuntu: `/srv/measurelog`

```text
storage/
├── uploads/    ανεβασμένα Excel (+ CSV μετατραπέντα σε xlsx)
├── imports/    (μελλοντική χρήση)
├── exports/    (μελλοντική χρήση)
├── backups/    pg_dump *.dump
└── desktop/    installer + latest.yml της desktop εφαρμογής
```

## Σημειώσεις

- Μοναδικό κλειδί κάθε μέτρησης είναι το `timestamp` (χρονοσειρά) — καμία διπλοεγγραφή.
- Ο parser εντοπίζει αυτόματα τη γραμμή κεφαλίδων και αγνοεί σκουπίδια από πάνω.
- Μη έγκυρες τιμές (εκτός φυσικών ορίων) αποθηκεύονται ως NULL, κρατώντας τις υπόλοιπες τιμές της γραμμής.
- Πριν από production: άλλαξε κωδικούς, `SECRET_KEY`, και μην εκθέτεις την 5432.
