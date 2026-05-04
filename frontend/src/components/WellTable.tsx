import type { Well } from "../types";
import { PRIORITY_COLORS } from "../types";

interface Props {
  wells: Well[];
  selected?: string | null;
  onSelect?: (w: Well) => void;
  limit?: number;
}

const fmt = (n: any) => (n == null || isNaN(n)) ? "—" : Math.round(n).toLocaleString();

export default function WellTable({ wells, selected, onSelect, limit = 200 }: Props) {
  const rows = wells.slice(0, limit);
  return (
    <div className="panel" style={{ margin: 0, height: "100%" }}>
      <div className="panel-head">
        <h3>Act · Candidate Queue</h3>
        <span className="meta">{wells.length} wells · top {rows.length} shown</span>
      </div>
      <div className="panel-body" style={{ overflow: "auto" }}>
        <table className="well-table">
          <thead>
            <tr>
              <th>P</th>
              <th>Well</th>
              <th>GC</th>
              <th>Reservoir</th>
              <th>Reason</th>
              <th>AL</th>
              <th style={{ textAlign: "right" }}>Potential BOPD</th>
              <th style={{ textAlign: "right" }}>WC%</th>
              <th style={{ textAlign: "right" }}>WO</th>
              <th style={{ textAlign: "right" }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(w => (
              <tr
                key={w.well_name}
                className={selected === w.well_name ? "selected" : ""}
                onClick={() => onSelect?.(w)}
              >
                <td>
                  <span className="priority-pill" style={{ background: PRIORITY_COLORS[w.priority] }}>
                    {w.priority}
                  </span>
                </td>
                <td className="well">{w.well_name}</td>
                <td>{w.facility || "—"}</td>
                <td>{w.reservoir || "—"}</td>
                <td style={{ color: "#d8c8a3" }}>{w.reason_label}</td>
                <td>{w.al_method || "—"}</td>
                <td style={{ textAlign: "right" }}>{fmt(w.potential_oil)}</td>
                <td style={{ textAlign: "right" }}>{w.latest_wc != null ? w.latest_wc.toFixed(0) : "—"}</td>
                <td style={{ textAlign: "right" }}>{w.wo_count}</td>
                <td style={{ textAlign: "right", color: "#ffb83d" }}>
                  {w.startup_score != null ? w.startup_score.toFixed(1) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
