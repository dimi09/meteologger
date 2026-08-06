# MeteoLogger

Πλατφόρμα συλλογής, αποθήκευσης και παρακολούθησης μετρήσεων μετεωρολογικού σταθμού DAVIS.
Backend (FastAPI) + Admin (Vue2/ElementUI) + PostgreSQL + Grafana + Adminer + αυτόματα backups,
όλα μέσω Docker Compose πίσω από reverse proxy με ονόματα.

## Γρήγορη εκκίνηση

```bash
cp .env.example .env      # άλλαξε κωδικούς/SECRET_KEY
docker compose build
docker compose up -d
docker compose ps
```

### Ονοματισμένη πρόσβαση (προτεινόμενο)

Πρόσθεσε στο hosts των client PC:

- Windows: `C:\Windows\System32\drivers\etc\hosts`
- Linux/Mac: `/etc/hosts`

```text
127.0.0.1   admin.meteologger.local grafana.meteologger.local adminer.meteologger.local
```

(Στο LAN βάλε την IP του server αντί για 127.0.0.1, π.χ. `192.168.1.18`.)

Μετά:

- Διαχειριστικό: http://admin.meteologger.local
- Grafana:       http://grafana.meteologger.local
- Adminer:       http://adminer.meteologger.local

### Dev πρόσβαση (χωρίς hosts, προαιρετικό)

- Swagger:  http://localhost:8000/docs
- Grafana:  http://localhost:3000
- Adminer:  http://localhost:8080

## Είσοδος διαχειριστικού

Τα credentials από το `.env` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`).

## Δομή

```text
meteologger/
├── compose.yaml
├── .env / .env.example
├── backend/        FastAPI (auth, import excel/csv, files, backups, summary)
├── frontend/       Vue2 + ElementUI + Vuex + Axios (admin)
├── nginx/          reverse proxy (ονόματα)
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
└── backups/    pg_dump *.dump
```

## Σημειώσεις

- Μοναδικό κλειδί κάθε μέτρησης είναι το `timestamp` (χρονοσειρά) — καμία διπλοεγγραφή.
- Ο parser εντοπίζει αυτόματα τη γραμμή κεφαλίδων και αγνοεί σκουπίδια από πάνω.
- Μη έγκυρες τιμές (εκτός φυσικών ορίων) αποθηκεύονται ως NULL, κρατώντας τις υπόλοιπες τιμές της γραμμής.
- Πριν από production: άλλαξε κωδικούς, `SECRET_KEY`, και μην εκθέτεις την 5432.
