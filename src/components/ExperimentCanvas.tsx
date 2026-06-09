import type { ExperimentSnapshot } from "../sim/types";

interface ExperimentCanvasProps {
  snapshot: ExperimentSnapshot;
  caption: string;
  legendA: string;
  legendB: string;
}

export function ExperimentCanvas({ snapshot, caption, legendA, legendB }: ExperimentCanvasProps) {
  return (
    <section className="experiment-panel canvas-panel" aria-label={caption}>
      <svg
        className="experiment-canvas"
        viewBox={`0 0 ${snapshot.width} ${snapshot.height}`}
        role="img"
        aria-label={caption}
      >
        <rect x="0" y="0" width={snapshot.width} height={snapshot.height} rx="10" />
        {snapshot.points.map((point) => (
          snapshot.mode === "lattice" ? (
            <rect
              key={point.id}
              x={point.x - latticeCellFillSize(point.radius) / 2}
              y={point.y - latticeCellFillSize(point.radius) / 2}
              width={latticeCellFillSize(point.radius)}
              height={latticeCellFillSize(point.radius)}
              className={point.mode === "A" ? "particle particle-a" : "particle particle-b"}
            />
          ) : (
            <circle
              key={point.id}
              cx={point.x}
              cy={point.y}
              r={point.radius}
              className={point.mode === "A" ? "particle particle-a" : "particle particle-b"}
            />
          )
        ))}
      </svg>
      <div className="canvas-footer">
        <div className="legend">
          <span>
            <i className="dot dot-a" />
            {legendA}
          </span>
          <span>
            <i className="dot dot-b" />
            {legendB}
          </span>
        </div>
        <span>{caption}</span>
      </div>
    </section>
  );
}

function latticeCellFillSize(radius: number): number {
  return (radius / 0.36) * 0.9;
}
