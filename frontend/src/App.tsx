import { useEffect, useMemo, useState } from "react";
import { fetchSnapshot } from "./api";
import type { Snapshot, Well } from "./types";
import { PRIORITY_COLORS, PRIORITY_LABEL } from "./types";
import WellMap from "./components/WellMap";
import WellDetail from "./components/WellDetail";
import PriorityChart from "./components/PriorityChart";
import LogicChart from "./components/LogicChart";
import WellTable from "./components/WellTable";

type Stage = "OBSERVE" | "ORIENT" | "DECIDE" | "ACT";
const STAGES: { id: Stage; label: string; sub: string }[] = [
  { id: "OBSERVE", label: "Observe", sub: "Inventory & Signals" },
  { id: "ORIENT",  label: "Orient",  sub: "Cause & Severity" },
  { id: "DECIDE",  label: "Decide",  sub: "Priority & Plan" },
  { id: "ACT",     label: "Act",     sub: "Startup Queue" },
];

export default function App() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [stage, setStage] = useState<Stage>("DECIDE");
  const [selected, setSelected] = useState<string | null>(null);

  // filters
  const [priority, setPriority] = useState<string>("");
  const [facility, setFacility] = useState<string>("");
  const [reservoir, setReservoir] = useState<string>("");
  const [contractor, setContractor] = useState<string>("");
  const [alMethod, setAlMethod] = useState<string>("");
  const [team, setTeam] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    fetchSnapshot().then(setSnap);
  }, []);

  const wells = snap?.wells ?? [];
  const kpis = snap?.kpis;

  const filtered = useMemo(() => {
    return wells.filter(w => {
      if (priority && w.priority !== priority) return false;
      if (facility && w.facility !== facility) return false;
      if (reservoir && w.reservoir !== reservoir) return false;
      if (contractor && w.contractor !== contractor) return false;
      if (alMethod && w.al_method !== alMethod) return false;
      if (team && w.team !== team) return false;
      if (search && !w.well_name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }).sort((a, b) => {
      if (a.priority !== b.priority) return a.priority.localeCompare(b.priority);
      return (b.startup_score || 0) - (a.startup_score || 0);
    });
  }, [wells, priority, facility, reservoir, contractor, alMethod, team, search]);

  const selectedWell = useMemo(
    () => filtered.find(w => w.well_name === selected) ?? wells.find(w => w.well_name === selected) ?? null,
    [selected, filtered, wells]
  );

  const distinct = useMemo(() => {
    const f = new Set<string>(), r = new Set<string>(), c = new Set<string>(), a = new Set<string>(), t = new Set<string>();
    for (const w of wells) {
      if (w.facility) f.add(w.facility);
      if (w.reservoir) r.add(w.reservoir);
      if (w.contractor) c.add(w.contractor);
      if (w.al_method) a.add(w.al_method);
      if (w.team) t.add(w.team);
    }
    return {
      facilities: [...f].sort(),
      reservoirs: [...r].sort(),
      contractors: [...c].sort(),
      al_methods: [...a].sort(),
      teams: [...t].sort(),
    };
  }, [wells]);

  if (!snap || !kpis) {
    return (
      <div className="app">
        <div className="topbar"><div className="brand"><span className="dot"/>WELL STARTUP <span className="sep">/</span> Decision Console</div></div>
        <div className="ooda" />
        <div className="loading">Loading inventory…</div>
      </div>
    );
  }

  const P1Count = kpis.by_priority?.P1 ?? 0;
  const P1Potential = Math.round(kpis.potential_by_priority?.P1 ?? 0);

  return (
    <div className="app">
      {/* Top bar */}
      <div className="topbar">
        <div className="brand">
          <span className="dot" />
          <span>WELL STARTUP</span>
          <span className="sep">/</span>
          <span style={{ color: "var(--beige-200)" }}>Decision Console</span>
          <span className="pill">OODA · GOTHAM</span>
        </div>
        <div className="topbar-meta">
          <span>Inventory <b>{kpis.total_wells_inventory ?? "—"}</b></span>
          <span>Closed <b>{kpis.total_closed_wells.toLocaleString()}</b></span>
          <span>Open <b>{kpis.total_open_wells ?? "—"}</b></span>
          <span>Recoverable <b>{(kpis.potential_oil_total_bopd / 1000).toFixed(0)}k BOPD</b></span>
        </div>
      </div>

      {/* OODA stepper */}
      <div className="ooda">
        {STAGES.map((s, i) => (
          <div
            key={s.id}
            className={`ooda-step${stage === s.id ? " active" : ""}`}
            onClick={() => setStage(s.id)}
          >
            <span className="num">{i + 1}</span>
            <span>{s.label}</span>
            <span style={{ opacity: 0.6, fontSize: 10, letterSpacing: "0.06em", textTransform: "none" }}>· {s.sub}</span>
            {i < STAGES.length - 1 && <span className="ooda-arrow">▶</span>}
          </div>
        ))}
      </div>

      {/* Main 3-column */}
      <div className="main">
        {/* LEFT — filters & priority list */}
        <div className="left">
          <div className="sidebar-section">
            <div className="sidebar-title">Search</div>
            <div className="filter-row">
              <input
                placeholder="Well name…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">Startup Priority</div>
            <div className="priority-list">
              <div
                className={`priority-item${priority === "" ? " active" : ""}`}
                onClick={() => setPriority("")}
              >
                <span className="swatch" style={{ background: "#8a7a5d" }} />
                <span className="label">All <small>{kpis.total_closed_wells}</small></span>
                <span className="count">{wells.length}</span>
              </div>
              {(["P1", "P2", "P3", "P4", "P5"] as const).map(p => (
                <div
                  key={p}
                  className={`priority-item${priority === p ? " active" : ""}`}
                  onClick={() => setPriority(priority === p ? "" : p)}
                >
                  <span className="swatch" style={{ background: PRIORITY_COLORS[p] }} />
                  <span className="label">{p} <small>{PRIORITY_LABEL[p]}</small></span>
                  <span className="count">{kpis.by_priority?.[p] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-title">Filters</div>
            <div className="filter-row">
              <label>Gathering Center (GC)</label>
              <select value={facility} onChange={e => setFacility(e.target.value)}>
                <option value="">All</option>
                {distinct.facilities.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className="filter-row">
              <label>Reservoir</label>
              <select value={reservoir} onChange={e => setReservoir(e.target.value)}>
                <option value="">All</option>
                {distinct.reservoirs.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="filter-row">
              <label>Contractor</label>
              <select value={contractor} onChange={e => setContractor(e.target.value)}>
                <option value="">All</option>
                {distinct.contractors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="filter-row">
              <label>AL Method</label>
              <select value={alMethod} onChange={e => setAlMethod(e.target.value)}>
                <option value="">All</option>
                {distinct.al_methods.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="filter-row">
              <label>Team</label>
              <select value={team} onChange={e => setTeam(e.target.value)}>
                <option value="">All</option>
                {distinct.teams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* CENTER */}
        <div className="center">
          {/* KPI strip */}
          <div className="kpi-strip">
            <div className="kpi">
              <div className="k">P1 Quick-Win Wells</div>
              <div className="v">{P1Count}</div>
              <div className="sub">{P1Potential.toLocaleString()} BOPD recoverable</div>
            </div>
            <div className="kpi">
              <div className="k">Closed Inventory</div>
              <div className="v muted">{kpis.total_closed_wells.toLocaleString()}</div>
              <div className="sub">of {kpis.total_wells_inventory ?? "—"} total</div>
            </div>
            <div className="kpi">
              <div className="k">GC Capacity Closures</div>
              <div className="v muted">{kpis.by_reason?.["GC Capacity"] ?? 0}</div>
              <div className="sub">low-effort restart candidates</div>
            </div>
            <div className="kpi">
              <div className="k">Total Recoverable</div>
              <div className="v">{(kpis.potential_oil_total_bopd / 1000).toFixed(0)}k</div>
              <div className="sub">BOPD potential</div>
            </div>
            <div className="kpi">
              <div className="k">Top GC</div>
              <div className="v muted" style={{ fontSize: 18 }}>
                {Object.entries(kpis.by_facility ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"}
              </div>
              <div className="sub">{Object.entries(kpis.by_facility ?? {}).sort((a, b) => b[1] - a[1])[0]?.[1] ?? 0} closed wells</div>
            </div>
          </div>

          {/* Map panel */}
          <div className="panel">
            <div className="panel-head">
              <h3>{stage === "OBSERVE" ? "Observe" : stage === "ORIENT" ? "Orient" : stage === "DECIDE" ? "Decide" : "Act"} · Field Map</h3>
              <span className="meta">
                {filtered.length} wells · sized by potential · colored by priority
              </span>
            </div>
            <div className="panel-body">
              <WellMap
                wells={filtered}
                selected={selected}
                onSelect={(w) => setSelected(w.well_name)}
                facilityFilter={facility || null}
              />
            </div>
          </div>

          {/* Bottom strip: chart + WO summary */}
          <div className="bottom-strip">
            {stage === "ORIENT" ? <LogicChart /> : <PriorityChart kpis={kpis} />}
            <WellTable
              wells={filtered}
              selected={selected}
              onSelect={(w) => setSelected(w.well_name)}
              limit={500}
            />
          </div>
        </div>

        {/* RIGHT — well detail */}
        <div className="right">
          <WellDetail well={selectedWell} />
        </div>
      </div>
    </div>
  );
}
