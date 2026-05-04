import { useMemo, useRef, useState, useEffect } from "react";
import type { Well } from "../types";
import { PRIORITY_COLORS } from "../types";

interface Props {
  wells: Well[];
  selected?: string | null;
  onSelect?: (w: Well) => void;
  facilityFilter?: string | null;
}

export default function WellMap({ wells, selected, onSelect, facilityFilter }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ w: 800, h: 500 });
  const [hover, setHover] = useState<{ well: Well; x: number; y: number } | null>(null);

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const resize = () => {
      const r = el.getBoundingClientRect();
      setSize({ w: r.width, h: r.height });
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points = useMemo(() => {
    return wells.filter(w => w.x != null && w.y != null);
  }, [wells]);

  const bounds = useMemo(() => {
    if (!points.length) return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x! < minX) minX = p.x!;
      if (p.x! > maxX) maxX = p.x!;
      if (p.y! < minY) minY = p.y!;
      if (p.y! > maxY) maxY = p.y!;
    }
    return { minX, maxX, minY, maxY };
  }, [points]);

  const pad = 30;
  const W = Math.max(size.w, 100), H = Math.max(size.h, 100);
  const xRange = bounds.maxX - bounds.minX || 1;
  const yRange = bounds.maxY - bounds.minY || 1;
  const scale = Math.min((W - pad * 2) / xRange, (H - pad * 2) / yRange);
  const offsetX = (W - xRange * scale) / 2 - bounds.minX * scale;
  const offsetY = (H - yRange * scale) / 2 + bounds.maxY * scale;

  const project = (x: number, y: number) => ({
    px: x * scale + offsetX,
    py: -y * scale + offsetY,
  });

  // grid lines
  const gridLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const gridStep = 5000;
  for (let gx = Math.floor(bounds.minX / gridStep) * gridStep; gx <= bounds.maxX; gx += gridStep) {
    const a = project(gx, bounds.minY); const b = project(gx, bounds.maxY);
    gridLines.push({ x1: a.px, y1: a.py, x2: b.px, y2: b.py });
  }
  for (let gy = Math.floor(bounds.minY / gridStep) * gridStep; gy <= bounds.maxY; gy += gridStep) {
    const a = project(bounds.minX, gy); const b = project(bounds.maxX, gy);
    gridLines.push({ x1: a.px, y1: a.py, x2: b.px, y2: b.py });
  }

  return (
    <div className="map-wrap">
      <svg className="map-svg" ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <g className="map-grid">
          {gridLines.map((l, i) => (
            <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
          ))}
        </g>
        {points.map((w) => {
          const { px, py } = project(w.x!, w.y!);
          const isSel = selected === w.well_name;
          const dim = facilityFilter && w.facility !== facilityFilter;
          const r = isSel ? 5.5 : Math.min(2 + (w.potential_oil || 0) / 800, 5);
          return (
            <circle
              key={w.well_name}
              className={`map-dot${isSel ? " selected" : ""}`}
              cx={px} cy={py} r={r}
              fill={PRIORITY_COLORS[w.priority]}
              opacity={dim ? 0.15 : 0.85}
              onMouseEnter={(e) => setHover({ well: w, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHover(null)}
              onMouseMove={(e) => setHover({ well: w, x: e.clientX, y: e.clientY })}
              onClick={() => onSelect?.(w)}
            />
          );
        })}
      </svg>
      <div className="map-legend">
        {(["P1", "P2", "P3", "P4", "P5"] as const).map(p => (
          <div className="item" key={p}>
            <span className="dot" style={{ background: PRIORITY_COLORS[p] }} />
            {p}
          </div>
        ))}
      </div>
      {hover && (
        <div className="tooltip" style={{ left: hover.x + 14, top: hover.y - 60 }}>
          <div className="name">{hover.well.well_name}</div>
          <div className="row"><span>GC</span><span>{hover.well.facility}</span></div>
          <div className="row"><span>Reservoir</span><span>{hover.well.reservoir}</span></div>
          <div className="row"><span>Priority</span><span>{hover.well.priority} · {hover.well.priority_label}</span></div>
          <div className="row"><span>Reason</span><span>{hover.well.reason_label}</span></div>
          <div className="row"><span>Potential</span><span>{Math.round(hover.well.potential_oil)} BOPD</span></div>
          <div className="row"><span>Score</span><span>{hover.well.startup_score?.toFixed(1)}</span></div>
        </div>
      )}
    </div>
  );
}
