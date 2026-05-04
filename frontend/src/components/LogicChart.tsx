/**
 * Static "logic flow" diagram explaining the prioritization scoring.
 * Drawn in pure SVG so it has the Palantir tactical feel.
 */
export default function LogicChart() {
  // node coords on a 760x220 canvas
  const inputs = [
    { x: 20,  y: 10,  w: 150, h: 32, t: "Latest PGOR Oil" },
    { x: 20,  y: 50,  w: 150, h: 32, t: "Expected Oil"   },
    { x: 20,  y: 90,  w: 150, h: 32, t: "WC % / Decline" },
    { x: 20,  y: 130, w: 150, h: 32, t: "ESP Run Life"   },
    { x: 20,  y: 170, w: 150, h: 32, t: "WO Count + Last" },
  ];
  const intermediate = [
    { x: 230, y: 30,  w: 170, h: 30, t: "Production Potential" },
    { x: 230, y: 80,  w: 170, h: 30, t: "Reason Severity 1-5"  },
    { x: 230, y: 130, w: 170, h: 30, t: "Equipment Risk"       },
    { x: 230, y: 180, w: 170, h: 30, t: "Workover Burden"      },
  ];
  const score = { x: 460, y: 95, w: 160, h: 50, t: "Startup Score" };
  const buckets = [
    { x: 660, y: 10,  w: 90, h: 26, t: "P1 Quick Win",   c: "#ffb83d" },
    { x: 660, y: 46,  w: 90, h: 26, t: "P2 Surface",     c: "#ff9849" },
    { x: 660, y: 82,  w: 90, h: 26, t: "P3 Rigless WO",  c: "#cf6b3a" },
    { x: 660, y: 118, w: 90, h: 26, t: "P4 Rig WO",      c: "#8a4a2b" },
    { x: 660, y: 154, w: 90, h: 26, t: "P5 Hold/Review", c: "#665544" },
  ];

  const edge = (x1: number, y1: number, x2: number, y2: number) =>
    `M${x1} ${y1} C ${x1 + (x2 - x1) / 2} ${y1}, ${x1 + (x2 - x1) / 2} ${y2}, ${x2} ${y2}`;

  return (
    <div className="panel" style={{ margin: 0 }}>
      <div className="panel-head">
        <h3>Orient · Scoring Logic</h3>
        <span className="meta">Observe → Orient → Decide</span>
      </div>
      <div className="panel-body" style={{ padding: 6 }}>
        <svg className="logic-svg" viewBox="0 0 770 220" preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0 0 L10 5 L0 10 z" className="logic-arrow" />
            </marker>
          </defs>

          {/* edges from inputs to intermediates */}
          {/* PGOR + Expected -> Production Potential */}
          <path className="logic-edge" d={edge(170, 26, 230, 45)} markerEnd="url(#arrow)" />
          <path className="logic-edge" d={edge(170, 66, 230, 45)} markerEnd="url(#arrow)" />
          {/* WC -> Reason severity / Risk */}
          <path className="logic-edge" d={edge(170, 106, 230, 95)} markerEnd="url(#arrow)" />
          {/* ESP -> Equipment risk */}
          <path className="logic-edge" d={edge(170, 146, 230, 145)} markerEnd="url(#arrow)" />
          {/* WO -> Burden */}
          <path className="logic-edge" d={edge(170, 186, 230, 195)} markerEnd="url(#arrow)" />

          {/* intermediate -> score */}
          {intermediate.map((n, i) => (
            <path key={i} className="logic-edge" d={edge(n.x + n.w, n.y + n.h / 2, score.x, score.y + score.h / 2)} markerEnd="url(#arrow)" />
          ))}

          {/* score -> buckets */}
          {buckets.map((b, i) => (
            <path key={i} className="logic-edge" d={edge(score.x + score.w, score.y + score.h / 2, b.x, b.y + b.h / 2)} markerEnd="url(#arrow)" />
          ))}

          {/* nodes */}
          {inputs.map((n, i) => (
            <g key={`in-${i}`} className="logic-node input">
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="2" />
              <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 3.5} textAnchor="middle">{n.t}</text>
            </g>
          ))}
          {intermediate.map((n, i) => (
            <g key={`m-${i}`} className="logic-node">
              <rect x={n.x} y={n.y} width={n.w} height={n.h} rx="2" />
              <text x={n.x + n.w / 2} y={n.y + n.h / 2 + 3.5} textAnchor="middle">{n.t}</text>
            </g>
          ))}
          <g className="logic-node score">
            <rect x={score.x} y={score.y} width={score.w} height={score.h} rx="2" />
            <text x={score.x + score.w / 2} y={score.y + score.h / 2 + 4} textAnchor="middle">{score.t}</text>
            <text x={score.x + score.w / 2} y={score.y + score.h / 2 + 18} textAnchor="middle"
                  style={{ fontSize: 9, fill: "#d8c8a3", letterSpacing: "0.04em" }}>
              100·P + 30·F − 25·Sev − 15·WO − 10·WC − 10·Eq
            </text>
          </g>
          {buckets.map((b, i) => (
            <g key={`b-${i}`} className="logic-node">
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="2" fill={b.c} stroke="none" opacity="0.85" />
              <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 3.5} textAnchor="middle"
                    style={{ fill: "#1a1612", fontWeight: 700, letterSpacing: "0.06em" }}>{b.t}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
