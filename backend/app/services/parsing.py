"""Κοινή λογική ανάγνωσης/καθαρισμού/validation μετρήσεων DAVIS (Excel & CSV)."""
import numpy as np
import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import WeatherData

# Στήλες που αντιστοιχούν στο μοντέλο WeatherData
VALID_COLS = {
    "timestamp", "temp", "humidity", "barometer", "pressure",
    "windspeed", "winddirection", "windgust", "windgustdir",
    "rain", "rainrate", "dewpoint", "windchill", "radiation", "uv",
}

NON_NUMERIC = {"date", "time", "timestamp"}

# Φυσικά όρια ανά παράμετρο (min, max). Ό,τι πέφτει έξω -> NULL.
# Αντιμετωπίζει μετατοπισμένες γραμμές του DAVIS export (π.χ. windchill=1037).
BOUNDS = {
    "temp": (-40, 60),
    "humidity": (0, 1),
    "barometer": (800, 1100),
    "pressure": (20, 32),
    "windspeed": (0, 60),
    "winddirection": (0, 360),
    "windgust": (0, 80),
    "windgustdir": (0, 360),
    "rain": (0, 1000),
    "rainrate": (0, 300),
    "dewpoint": (-40, 40),
    "windchill": (-60, 60),
    "radiation": (0, 1500),
    "uv": (0, 20),
}


def _find_header_row(raw: pd.DataFrame) -> int:
    """Βρίσκει τη γραμμή headers (Date/Time ή Timestamp), αγνοώντας σκουπίδια από πάνω."""
    for i, row in raw.iterrows():
        values = {str(v).strip().lower() for v in row.values}
        if {"date", "time"}.issubset(values) or "timestamp" in values:
            return i
    raise ValueError("Δεν βρέθηκαν headers (Date/Time ή Timestamp) στο αρχείο.")


def _find_header_row_text(path: str) -> int:
    """Βρίσκει τη γραμμή headers σε CSV σαρώνοντας το κείμενο (αποφυγή tokenizer
    error όταν υπάρχουν ragged γραμμές-σκουπίδια από πάνω, π.χ. 'http://...')."""
    with open(path, "r", encoding="utf-8-sig", errors="replace") as fh:
        for i, line in enumerate(fh):
            cells = {c.strip().lower() for c in line.replace(";", ",").split(",")}
            if {"date", "time"}.issubset(cells) or "timestamp" in cells:
                return i
    raise ValueError("Δεν βρέθηκαν headers (Date/Time ή Timestamp) στο αρχείο.")


def read_measurements(path: str, ext: str) -> pd.DataFrame:
    """Διαβάζει XLSX ή CSV και επιστρέφει DataFrame με lowercase στήλες.
    Αγνοεί οποιεσδήποτε γραμμές-σκουπίδια πάνω από τον πίνακα."""
    if ext == ".xlsx":
        raw = pd.read_excel(path, header=None)
        header_row = _find_header_row(raw)
        df = pd.read_excel(path, header=header_row)
    else:  # .csv
        header_row = _find_header_row_text(path)
        # sep=None + engine='python' -> αυτόματη ανίχνευση διαχωριστικού (',' ή ';')
        df = pd.read_csv(path, header=0, skiprows=header_row, sep=None, engine="python")

    df.columns = df.columns.astype(str).str.strip().str.lower()
    return df


def build_timestamp(df: pd.DataFrame) -> pd.DataFrame:
    """Χτίζει το timestamp από (Date + Time) ή από στήλη Timestamp, χωρίς ασάφεια."""
    if "date" in df.columns and "time" in df.columns:
        d = pd.to_datetime(df["date"], errors="coerce", format="mixed", dayfirst=True).dt.normalize()
        t = pd.to_datetime(df["time"].astype(str), errors="coerce", format="mixed")
        df["timestamp"] = d + (t - t.dt.normalize())
    elif "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce", format="mixed", dayfirst=True)
    else:
        raise ValueError("Το αρχείο πρέπει να έχει είτε (Date + Time) είτε στήλη Timestamp.")
    return df.dropna(subset=["timestamp"])


def clean_numeric(df: pd.DataFrame) -> pd.DataFrame:
    """Καθαρίζει και μετατρέπει τις αριθμητικές στήλες σε πραγματικούς αριθμούς."""
    for col in df.columns:
        if col in NON_NUMERIC:
            continue
        s = (
            df[col].astype(str)
            .str.replace("%", "", regex=False)
            .str.replace(",", ".", regex=False)
            .str.strip()
        )
        df[col] = pd.to_numeric(s, errors="coerce")
    return df


def validate_ranges(df: pd.DataFrame) -> pd.DataFrame:
    """Μηδενίζει (NULL) τιμές εκτός φυσικών ορίων, κρατώντας τις υπόλοιπες της γραμμής."""
    for col, (lo, hi) in BOUNDS.items():
        if col in df.columns:
            df[col] = df[col].where(df[col].between(lo, hi), np.nan)
    if "dewpoint" in df.columns and "temp" in df.columns:
        bad = df["temp"].notna() & (df["dewpoint"] > df["temp"] + 0.5)
        df.loc[bad, "dewpoint"] = np.nan
    return df


def parse_dataframe(path: str, ext: str) -> pd.DataFrame:
    """Πλήρες pipeline: read -> timestamp -> clean -> validate. Επιστρέφει καθαρό DataFrame."""
    df = read_measurements(path, ext)
    df = build_timestamp(df)
    if df.empty:
        raise ValueError("Το αρχείο δεν περιέχει έγκυρες εγγραφές.")
    df = clean_numeric(df)
    df = validate_ranges(df)
    # Κρατάμε μόνο τις στήλες του μοντέλου
    df = df[[c for c in df.columns if c in VALID_COLS]]
    return df


def insert_measurements(df: pd.DataFrame, db: Session) -> int:
    """Εισάγει νέες εγγραφές, αγνοώντας διπλότυπα timestamp. Επιστρέφει πλήθος inserted."""
    existing = {row[0] for row in db.execute(select(WeatherData.timestamp)).all()}
    df_new = df[~df["timestamp"].isin(existing)].drop_duplicates(subset=["timestamp"])
    if df_new.empty:
        return 0
    df_new = df_new.astype(object).where(pd.notnull(df_new), None)
    records = df_new.to_dict(orient="records")
    db.bulk_save_objects([WeatherData(**rec) for rec in records])
    db.commit()
    return len(records)
