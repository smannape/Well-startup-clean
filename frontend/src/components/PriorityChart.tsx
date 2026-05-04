import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import type { KPIs } from "../types";
import { PRIORITY_COLORS, PRIORITY_LABEL } from "../types";

export default function PriorityChart({ kpis }: { kpis: KPIs }) {
  const data = (["P1", "P2", "P3", "P4", "P5"] as const).map(p => ({
    p,
    label: PRIORITY_LABEL[p],
    wells: kpis.by_priority?.[p] ?? 0,
    potential: Math.round(kpis.potential_by_priority?.[p] ?? 0),
  }));

  return (
    <div className="panel" style={{ margin: 0 }}>
      <div className="panel-head">
        <h3>Decision · Priority × Recoverable Oil</h3>
        <span className="meta">BOPD potential by bucket</span>
      </div>
      <div className="panel-body">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 18, right: 24, left: 6, bottom: 30 }}>
            <CartesianGrid stroke="#3a2f23" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="p"
              tick={{ fill: "#d8c8a3", fontSize: 11, letterSpacing: "0.1em" }}
              axisLine={{ stroke: "#4a3d2c" }} tickLine={false}
            />
            <YAxis
              tick={{ fill: "#8a7a5d", fontSize: 10, fontFamily: "JetBrains Mono" }}
              axisLine={false} tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
            />
            <Tooltip
              contentStyle={{
                background: "#14110d", border: "1px solid #b34000",
                fontFamily: "JetBrains Mono", fontSize: 11,
              }}
              labelStyle={{ color: "#ff9849" }}
              cursor={{ fill: "#ff7a1a14" }}
              formatter={(v: any, n: any, ctx: any) => {
                if (n === "potential") return [`${(+v).toLocaleString()} BOPD`, "Potential Oil"];
                return [v, "Wells"];
              }}
            />
            <Bar dataKey="potential" radius={[2, 2, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.p} fill={PRIORITY_COLORS[d.p]} />
              ))}
              <LabelList
                dataKey="wells"
                position="top"
                style={{ fill: "#ece1c7", fontSize: 10, fontFamily: "JetBrains Mono" }}
                formatter={(v: number) => `${v} wells`}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
