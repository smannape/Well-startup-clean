"""FastAPI app for Well Startup Plan dashboard.

Serves wells, workovers, perforations, KPIs from Postgres.
Falls back to data.json snapshot if DB is empty (useful for static demos).
"""
from __future__ import annotations

import json
import os
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from .db import engine

ROOT = Path(__file__).resolve().parent.parent          # /app inside container
SNAPSHOT_DIR = ROOT / "frontend" / "public"            # /app/frontend/public (volume-mounted)

app = FastAPI(title="Well Startup Plan API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- helpers ----------
def _load_json(name: str) -> Any:
    p = SNAPSHOT_DIR / name
    if not p.exists():
        raise HTTPException(503, detail=f"snapshot {name} not found")
    return json.loads(p.read_text(encoding="utf-8"))


def _pg_available() -> bool:
    try:
        with engine.connect() as c:
            c.execute(text("SELECT 1 FROM wells LIMIT 1"))
        return True
    except Exception:
        return False


# ---------- endpoints ----------
@app.get("/api/health")
def health():
    return {"status": "ok", "postgres": _pg_available()}


@app.get("/api/kpis")
def kpis():
    if _pg_available():
        with engine.connect() as c:
            total = c.execute(text("SELECT COUNT(*) FROM wells")).scalar() or 0
            potential = c.execute(text("SELECT COALESCE(SUM(potential_oil),0) FROM wells")).scalar() or 0
            by_priority = dict(c.execute(text(
                "SELECT priority, COUNT(*) FROM wells GROUP BY priority ORDER BY priority"
            )).all())
            potential_by_priority = dict(c.execute(text(
                "SELECT priority, COALESCE(SUM(potential_oil),0) FROM wells GROUP BY priority"
            )).all())
            by_facility = dict(c.execute(text(
                "SELECT facility, COUNT(*) FROM wells GROUP BY facility ORDER BY 2 DESC"
            )).all())
            by_reason = dict(c.execute(text(
                "SELECT reason_label, COUNT(*) FROM wells GROUP BY reason_label ORDER BY 2 DESC"
            )).all())
            by_al = dict(c.execute(text(
                "SELECT COALESCE(al_method,'Unknown'), COUNT(*) FROM wells GROUP BY al_method ORDER BY 2 DESC"
            )).all())
            by_contractor = dict(c.execute(text(
                "SELECT COALESCE(contractor,'Unknown'), COUNT(*) FROM wells GROUP BY contractor ORDER BY 2 DESC"
            )).all())
        return {
            "total_closed_wells": int(total),
            "potential_oil_total_bopd": int(potential),
            "by_priority": by_priority,
            "potential_by_priority": potential_by_priority,
            "by_facility": by_facility,
            "by_reason": by_reason,
            "by_al_method": by_al,
            "by_contractor": by_contractor,
        }
    snap = _load_json("data.json")
    return snap.get("kpis", {})


@app.get("/api/wells")
def list_wells(
    priority: str | None = None,
    facility: str | None = None,
    reservoir: str | None = None,
    contractor: str | None = None,
    al_method: str | None = None,
    team: str | None = None,
    q: str | None = None,
    limit: int = Query(default=2000, ge=1, le=10000),
    offset: int = Query(default=0, ge=0),
):
    if _pg_available():
        clauses = []
        params: dict[str, Any] = {"lim": limit, "off": offset}
        if priority:
            clauses.append("priority = :priority"); params["priority"] = priority
        if facility:
            clauses.append("facility = :facility"); params["facility"] = facility
        if reservoir:
            clauses.append("reservoir = :reservoir"); params["reservoir"] = reservoir
        if contractor:
            clauses.append("contractor = :contractor"); params["contractor"] = contractor
        if al_method:
            clauses.append("al_method = :al"); params["al"] = al_method
        if team:
            clauses.append("team = :team"); params["team"] = team
        if q:
            clauses.append("well_name ILIKE :q"); params["q"] = f"%{q}%"
        where = (" WHERE " + " AND ".join(clauses)) if clauses else ""
        sql = (
            "SELECT * FROM wells" + where +
            " ORDER BY priority, startup_score DESC LIMIT :lim OFFSET :off"
        )
        with engine.connect() as c:
            rows = [dict(r._mapping) for r in c.execute(text(sql), params)]
        return {"count": len(rows), "items": rows}

    # fallback: filter the snapshot
    snap = _load_json("data.json")
    items = snap["wells"]

    def keep(w):
        if priority and w.get("priority") != priority: return False
        if facility and w.get("facility") != facility: return False
        if reservoir and w.get("reservoir") != reservoir: return False
        if contractor and w.get("contractor") != contractor: return False
        if al_method and w.get("al_method") != al_method: return False
        if team and w.get("team") != team: return False
        if q and q.lower() not in (w.get("well_name") or "").lower(): return False
        return True

    items = [w for w in items if keep(w)]
    items.sort(key=lambda w: (w.get("priority") or "Z", -(w.get("startup_score") or 0)))
    return {"count": len(items), "items": items[offset:offset + limit]}


@app.get("/api/wells/{well_name}")
def well_detail(well_name: str):
    if _pg_available():
        with engine.connect() as c:
            row = c.execute(text("SELECT * FROM wells WHERE well_name = :w"), {"w": well_name}).first()
            if not row:
                raise HTTPException(404, "well not found")
            wo = [dict(r._mapping) for r in c.execute(
                text("SELECT * FROM workovers WHERE well_name = :w ORDER BY start_date DESC"),
                {"w": well_name}
            )]
            perf = [dict(r._mapping) for r in c.execute(
                text("SELECT * FROM perforations WHERE well_name = :w ORDER BY interval_start"),
                {"w": well_name}
            )]
            return {"well": dict(row._mapping), "workovers": wo, "perforations": perf}

    snap = _load_json("data.json")
    well = next((w for w in snap["wells"] if w["well_name"] == well_name), None)
    if not well:
        raise HTTPException(404, "well not found")
    wo = _load_json("workovers.json").get(well_name, [])
    perf = _load_json("perforations.json").get(well_name, [])
    return {"well": well, "workovers": wo, "perforations": perf}


@app.get("/api/filters")
def filters():
    """Distinct values for dashboard filters."""
    if _pg_available():
        with engine.connect() as c:
            facilities = [r[0] for r in c.execute(text("SELECT DISTINCT facility FROM wells WHERE facility IS NOT NULL ORDER BY 1"))]
            reservoirs = [r[0] for r in c.execute(text("SELECT DISTINCT reservoir FROM wells WHERE reservoir IS NOT NULL ORDER BY 1"))]
            contractors = [r[0] for r in c.execute(text("SELECT DISTINCT contractor FROM wells WHERE contractor IS NOT NULL ORDER BY 1"))]
            teams = [r[0] for r in c.execute(text("SELECT DISTINCT team FROM wells WHERE team IS NOT NULL ORDER BY 1"))]
            al = [r[0] for r in c.execute(text("SELECT DISTINCT al_method FROM wells WHERE al_method IS NOT NULL ORDER BY 1"))]
        return {"facilities": facilities, "reservoirs": reservoirs, "contractors": contractors, "teams": teams, "al_methods": al}
    snap = _load_json("data.json")
    wells = snap["wells"]
    return {
        "facilities": sorted({w["facility"] for w in wells if w.get("facility")}),
        "reservoirs": sorted({w["reservoir"] for w in wells if w.get("reservoir")}),
        "contractors": sorted({w["contractor"] for w in wells if w.get("contractor")}),
        "teams": sorted({w["team"] for w in wells if w.get("team")}),
        "al_methods": sorted({w["al_method"] for w in wells if w.get("al_method")}),
    }


@app.get("/api/snapshot")
def snapshot():
    """Single payload that the frontend can use to render everything offline."""
    return _load_json("data.json")
