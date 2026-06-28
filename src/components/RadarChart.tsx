import React, { useMemo } from "react";
import * as d3 from "d3";

interface RadarDataPoint {
  axis: string;
  candidateValue: number;
  benchmarkValue: number;
}

interface RadarChartProps {
  candidateName: string;
  skillsScore: number;
  experienceScore: number;
  formattingScore: number;
  atsScore: number;
  predictedShortlistChance: number;
}

export default function RadarChart({
  candidateName,
  skillsScore,
  experienceScore,
  formattingScore,
  atsScore,
  predictedShortlistChance,
}: RadarChartProps) {
  // Dimensions
  const width = 360;
  const height = 320;
  const margin = 50;
  const radius = Math.min(width, height) / 2 - margin;
  const cx = width / 2;
  const cy = height / 2;

  // Prepare data
  const data: RadarDataPoint[] = useMemo(() => [
    { axis: "Technical Skills", candidateValue: skillsScore, benchmarkValue: 75 },
    { axis: "Work Experience", candidateValue: experienceScore, benchmarkValue: 70 },
    { axis: "ATS Formatting", candidateValue: formattingScore, benchmarkValue: 80 },
    { axis: "ATS Compatibility", candidateValue: atsScore, benchmarkValue: 65 },
    { axis: "Shortlist Prob.", candidateValue: predictedShortlistChance, benchmarkValue: 60 },
  ], [skillsScore, experienceScore, formattingScore, atsScore, predictedShortlistChance]);

  const numAxes = data.length;

  // Create D3 linear scale for radius
  const rScale = useMemo(() => {
    return d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);
  }, [radius]);

  // Generate grid levels (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [20, 40, 60, 80, 100];

  // Calculate coordinates helper
  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 / numAxes) * index - Math.PI / 2;
    const r = rScale(value);
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Paths for polygons
  const candidatePath = useMemo(() => {
    const points = data.map((d, i) => {
      const { x, y } = getCoordinates(i, d.candidateValue);
      return `${x},${y}`;
    });
    return points.join(" ") + " " + points[0]; // Closed loop
  }, [data, rScale]);

  const benchmarkPath = useMemo(() => {
    const points = data.map((d, i) => {
      const { x, y } = getCoordinates(i, d.benchmarkValue);
      return `${x},${y}`;
    });
    return points.join(" ") + " " + points[0]; // Closed loop
  }, [data, rScale]);

  return (
    <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400">Skill Distribution Map</h4>
          <p className="text-[10px] text-slate-400 font-medium">Comparing <span className="text-teal-300 font-semibold">{candidateName}</span> against Industry Standards</p>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-teal-500" />
            <span className="text-slate-300">Candidate</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-indigo-500/50 border border-indigo-400/40 border-dashed" />
            <span className="text-slate-400">Benchmark</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center items-center">
        <svg width={width} height={height} className="overflow-visible">
          {/* Circular/Concentric background grid lines */}
          {gridLevels.map((level, i) => {
            const points = Array.from({ length: numAxes }).map((_, idx) => {
              const { x, y } = getCoordinates(idx, level);
              return `${x},${y}`;
            });
            const polygonPoints = points.join(" ");
            return (
              <g key={`grid-${i}`}>
                {/* Polygonal Grid ring */}
                <polygon
                  points={polygonPoints}
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.06)"
                  strokeWidth="1"
                />
                {/* Grid score labels */}
                <text
                  x={cx + 5}
                  y={cy - rScale(level) + 4}
                  fill="rgba(148, 163, 184, 0.4)"
                  className="text-[9px] font-mono font-medium"
                >
                  {level}%
                </text>
              </g>
            );
          })}

          {/* Draw axis lines and labels */}
          {data.map((d, i) => {
            const outerCoord = getCoordinates(i, 100);
            const labelAngle = (Math.PI * 2 / numAxes) * i - Math.PI / 2;
            
            // Adjust label offset positions so they don't overlap the chart
            const offsetDist = 18;
            const labelX = cx + (radius + offsetDist) * Math.cos(labelAngle);
            const labelY = cy + (radius + offsetDist) * Math.sin(labelAngle) + 3;

            // Determine text alignment based on horizontal position
            let textAnchor: "middle" | "start" | "end" = "middle";
            if (Math.cos(labelAngle) > 0.1) textAnchor = "start";
            else if (Math.cos(labelAngle) < -0.1) textAnchor = "end";

            return (
              <g key={`axis-${i}`}>
                {/* Ray line */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={outerCoord.x}
                  y2={outerCoord.y}
                  stroke="rgba(148, 163, 184, 0.1)"
                  strokeWidth="1"
                />
                {/* Axis label text */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor={textAnchor}
                  fill="rgba(226, 232, 240, 0.8)"
                  className="text-[10px] font-semibold font-sans tracking-tight"
                >
                  {d.axis}
                </text>
              </g>
            );
          })}

          {/* Benchmark Polygon */}
          <polygon
            points={benchmarkPath}
            fill="rgba(99, 102, 241, 0.03)"
            stroke="rgba(99, 102, 241, 0.45)"
            strokeWidth="1.5"
            strokeDasharray="3,3"
          />

          {/* Candidate Polygon */}
          <polygon
            points={candidatePath}
            fill="rgba(20, 184, 166, 0.12)"
            stroke="rgba(20, 184, 166, 0.8)"
            strokeWidth="2.5"
          />

          {/* Benchmark Vertex Dots */}
          {data.map((d, i) => {
            const { x, y } = getCoordinates(i, d.benchmarkValue);
            return (
              <circle
                key={`bench-dot-${i}`}
                cx={x}
                cy={y}
                r="3"
                fill="#312e81"
                stroke="#6366f1"
                strokeWidth="1"
              />
            );
          })}

          {/* Candidate Vertex Dots */}
          {data.map((d, i) => {
            const { x, y } = getCoordinates(i, d.candidateValue);
            return (
              <g key={`cand-dot-${i}`} className="group cursor-pointer">
                <circle
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#0f172a"
                  stroke="#14b8a6"
                  strokeWidth="2"
                  className="transition duration-150 group-hover:scale-150 group-hover:fill-teal-400"
                />
                {/* Tooltip on hovering a vertex */}
                <title>{`${d.axis}: ${d.candidateValue}%`}</title>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="grid grid-cols-5 gap-2 text-center pt-2 border-t border-slate-900/50">
        {data.map((d, i) => (
          <div key={i} className="space-y-0.5">
            <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider block truncate" title={d.axis}>
              {d.axis}
            </span>
            <div className="flex items-center justify-center gap-1">
              <span className="text-[10px] text-slate-200 font-bold font-mono">
                {d.candidateValue}%
              </span>
              <span className={`text-[8px] font-bold font-mono ${d.candidateValue >= d.benchmarkValue ? "text-emerald-400" : "text-amber-500"}`}>
                {d.candidateValue >= d.benchmarkValue ? `+${d.candidateValue - d.benchmarkValue}` : `${d.candidateValue - d.benchmarkValue}`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
