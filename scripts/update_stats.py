#!/usr/bin/env python3
"""Update IzzyOnDroid and F-Droid download-count JSON files.

Fetches the latest download totals for the RepoStore package and writes them
to data/izzy-stats.json and data/fdroid-stats.json. If a source can't be
reached or returns no usable value, the existing file is left untouched so a
transient failure never wipes out a good count.
"""

import json
import os
import sys
import urllib.request
from datetime import datetime, timezone

PACKAGE = os.environ.get("PACKAGE", "com.samyak.repostore")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

IZZY_URL = "https://dlstats.izzyondroid.org/iod-stats-collector/stats/basic/yearly/rolling.json"
FDROID_URL = (
    "https://raw.githubusercontent.com/kitswas/fdroid-metrics-dashboard/"
    f"main/processed/total/{PACKAGE}.json"
)


def fetch_json(url):
    """Return parsed JSON from url, or None on any failure."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "repostore-stats-bot"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.load(resp)
    except Exception as err:  # noqa: BLE001 - never let a fetch crash the run
        print(f"Failed to fetch {url}: {err}", file=sys.stderr)
        return None


def coerce_count(value):
    """Return value as a non-negative int, or None if it isn't usable."""
    try:
        n = int(value)
    except (TypeError, ValueError):
        return None
    return n if n >= 0 else None


def write_stats(filename, payload):
    os.makedirs(DATA_DIR, exist_ok=True)
    path = os.path.join(DATA_DIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
        f.write("\n")
    print(f"Wrote {path}: {payload}")


def update_izzy(date):
    data = fetch_json(IZZY_URL)
    count = coerce_count(data.get(PACKAGE)) if isinstance(data, dict) else None
    if count is None:
        print(f"Could not read IzzyOnDroid count for {PACKAGE}; leaving existing value.")
        return
    write_stats(
        "izzy-stats.json",
        {"package": PACKAGE, "downloads": count, "updated": date},
    )


def update_fdroid(date):
    data = fetch_json(FDROID_URL)
    count = coerce_count(data.get("total_downloads")) if isinstance(data, dict) else None
    if count is None:
        print(f"Could not read F-Droid count for {PACKAGE}; leaving existing value.")
        return
    write_stats(
        "fdroid-stats.json",
        {"package": PACKAGE, "downloads": count, "period": "total", "updated": date},
    )


def main():
    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    update_izzy(date)
    update_fdroid(date)


if __name__ == "__main__":
    main()
