import { useEffect, useState } from "react";
import type { Well, Workover, Perforation } from "../types";
import { PRIORITY_COLORS } from "../types";
import { fetchWorkovers, fetchPerforations } from "../api";

interface Props { well: Well | null; }

const fmt = (n: any, d = 0) =>
  (n == null || isNaN(n)) ? "—" : Number(n).toLocaleString(undefined, { maximumFractionDigits: d });
const dt = (s: any) => s ? new Date(s).toISOString().slice(0, 10) : "—";

export default function WellDetail({ well }: Props) {
  const [wos, setWos] = useState<Workover[]>([]);
  const [perfs, setPerfs] = useState<Perforation[]>([]);

  useEffect(() => {
    if (!well) { setWos([]); setPerfs([]); return; }
    fetchWorkovers().then(map => {
      const arr = (map[well.well_name] || []).slice();
      arr.sort((a, b) => (b.start_date || "").localeCompare(a.start_date || ""));
      setWos(arr);
    });
    fetchPerforations().then(map => setPerfs(map[well.well_name] || []));
  }, [well?.well_name]);

  if (!well) {
    return (
      <div className="detail">
        <div className="section-h">Act · Well Detail</div>
        <p style={{ fontSize: 11, color: "#8a7a5d", lineHeight: 1.7 }}>
          Click a dot on the map or a row in the candidates list to view full
          history, perforations, workovers, contractor and PE notes.
        </p>
      </div>
    );
  }

  return (
    <div className="detail">
      <h2 className="well-name">{well.well_name}</h2>
      <div className="well-sub">
        {well.field} · {well.reservoir} · {well.facility}
      </div>

      <div className="badges">
        <span className="badge priority" style={{ background: PRIORITY_COLORS[well.priority] }}>
          {well.priority} · {well.priority_label}
        </span>
        {well.al_method && <span className="badge al">{well.al_method}</span>}
        {well.contractor && <span className="badge">{well.contractor}</span>}
        {well.well_type && <span className="badge">{well.well_type}</span>}
      </div>

      <div className="kv">
        <div className="k">Closure Reason</div><div className="v">{well.reason_label}</div>
        <div className="k">Closed Since</div><div className="v">{dt(well.operational_status_date)}</div>
        <div className="k">Action Activity</div><div className="v">{well.closed_action_activity || "—"}</div>
        <div className="k">Action Status</div><div className="v">{well.closed_action_status || "—"}</div>
        <div className="k">Startup Score</div><div className="v" style={{ color: PRIORITY_COLORS[well.priority] }}>{fmt(well.startup_score, 1)}</div>
      </div>

      <div className="section-h">Production Snapshot</div>
      <div className="kv">
        <div className="k">Latest Oil</div><div className="v">{fmt(well.latest_oil)} BOPD</div>
        <div className="k">Latest Liquid</div><div className="v">{fmt(well.latest_liquid)} BLPD</div>
        <div className="k">Water Cut</div><div className="v">{fmt(well.latest_wc, 1)} %</div>
        <div className="k">GOR</div><div className="v">{fmt(well.latest_gor)} scf/stb</div>
        <div className="k">Expected Oil</div><div className="v">{fmt(well.expected_oil)} BOPD</div>
        <div className="k">Potential Oil</div>
        <div className="v" style={{ color: "#ffb83d" }}>{fmt(well.potential_oil)} BOPD</div>
        <div className="k">Latest PGOR</div><div className="v">{dt(well.latest_pgor_date)}</div>
        <div className="k">Allowable</div><div className="v">{fmt(well.allowable_rate)} BLPD</div>
      </div>

      <div className="section-h">Equipment</div>
      <div className="kv">
        <div className="k">AL Method</div><div className="v">{well.al_method || "—"}</div>
        <div className="k">ESP Run Life</div><div className="v">{fmt(well.esp_run_life)} d</div>
        <div className="k">Contractor</div><div className="v">{well.contractor || "—"}</div>
        <div className="k">Install / Comm.</div><div className="v">{dt(well.install_date)} / {dt(well.commission_date)}</div>
        <div className="k">Last AL Activity</div><div className="v">{well.last_imp_activity || "—"}</div>
      </div>

      <div className="section-h">Reservoir / Perforation</div>
      <div className="kv">
        <div className="k">Reservoir</div><div className="v">{well.reservoir || "—"}</div>
        <div className="k">Formations</div><div className="v">{well.formations || "—"}</div>
        <div className="k">Perf Top / Btm</div><div className="v">{fmt(well.perf_top)} – {fmt(well.perf_bottom)} ft</div>
        <div className="k">Perf Count</div><div className="v">{fmt(well.perforation_count)}</div>
        <div className="k">API Gravity</div><div className="v">{fmt(well.api_gravity, 1)}°</div>
      </div>
      {perfs.length > 0 && (
        <div style={{ fontSize: 10, fontFamily: "JetBrains Mono", color: "#b8a785", marginTop: 4 }}>
          {perfs.slice(0, 6).map((p, i) => (
            <div key={i}>{p.formation || "—"} · {p.interval_start}–{p.interval_end} ft · {p.status || ""}</div>
          ))}
        </div>
      )}

      <div className="section-h">Workover History ({well.wo_count})</div>
      <div className="wo-list">
        {wos.length === 0 && <div style={{ fontSize: 11, color: "#8a7a5d" }}>No workover records.</div>}
        {wos.slice(0, 8).map((w, i) => (
          <div key={i} className="wo-item">
            <div className="top">
              <span className="type">{w.activity_type} {w.activity_code ? `· ${w.activity_code}` : ""}</span>
              <span className="date">{dt(w.start_date)} → {dt(w.end_date)}</span>
            </div>
            {w.purpose && <div className="purpose">{w.purpose}</div>}
            {w.summary && <div className="summary">{w.summary.slice(0, 220)}{w.summary.length > 220 ? "…" : ""}</div>}
          </div>
        ))}
      </div>

      {(well.pe_comment || well.re_comment || well.fd_action_plan) && (
        <>
          <div className="section-h">Engineering Notes</div>
          {well.pe_comment && <div style={{ fontSize: 11, marginBottom: 6 }}><b style={{ color: "#ff9849" }}>PE:</b> {well.pe_comment}</div>}
          {well.re_comment && <div style={{ fontSize: 11, marginBottom: 6 }}><b style={{ color: "#ff9849" }}>RE:</b> {well.re_comment}</div>}
          {well.fd_action_plan && <div style={{ fontSize: 11, marginBottom: 6 }}><b style={{ color: "#ff9849" }}>FD:</b> {well.fd_action_plan}</div>}
        </>
      )}
    </div>
  );
}
