/**
 * @file Lightweight SVG-based chart components (no external dependencies).
 * All components are pure SVG, responsive via viewBox.
 */

/**
 * Renders a simple SVG polyline sparkline.
 * @param {object} props
 * @param {number[]} props.data - Array of numeric values
 * @param {number} [props.width=200] - SVG width
 * @param {number} [props.height=50] - SVG height
 * @param {string} [props.color="#6366f1"] - Stroke color
 * @returns {JSX.Element}
 */
export function SparkLine({ data = [], width = 200, height = 50, color = "#6366f1" }) {
  if (!data.length) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 2;
  const usableH = height - padding * 2;
  const stepX = (width - padding * 2) / Math.max(data.length - 1, 1);

  const points = data
    .map((v, i) => {
      const x = padding + i * stepX;
      const y = padding + usableH - ((v - min) / range) * usableH;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Renders an SVG bar chart with labels.
 * @param {object} props
 * @param {{ label: string, value: number }[]} props.data - Array of { label, value }
 * @param {number} [props.width=400] - SVG width
 * @param {number} [props.height=200] - SVG height
 * @param {string} [props.barColor="#6366f1"] - Bar fill color
 * @returns {JSX.Element}
 */
export function BarChart({ data = [], width = 400, height = 200, barColor = "#6366f1" }) {
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.value));
  const paddingTop = 20;
  const paddingBottom = 30;
  const paddingX = 10;
  const barAreaH = height - paddingTop - paddingBottom;
  const barWidth = Math.min(40, (width - paddingX * 2) / data.length - 8);
  const gap = (width - paddingX * 2 - barWidth * data.length) / (data.length + 1);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      {data.map((d, i) => {
        const barH = max ? (d.value / max) * barAreaH : 0;
        const x = paddingX + gap + i * (barWidth + gap);
        const y = paddingTop + barAreaH - barH;

        return (
          <g key={i}>
            <rect x={x} y={y} width={barWidth} height={barH} fill={barColor} rx="3" />
            <text
              x={x + barWidth / 2}
              y={y - 4}
              textAnchor="middle"
              fontSize="10"
              fill="#475569"
            >
              {d.value.toLocaleString()}
            </text>
            <text
              x={x + barWidth / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Renders an SVG donut/pie chart with percentage labels.
 * @param {object} props
 * @param {{ label: string, value: number, color: string }[]} props.segments - Segments
 * @param {number} [props.size=200] - SVG size (square)
 * @returns {JSX.Element}
 */
export function DonutChart({ segments = [], size = 200 }) {
  if (!segments.length) return null;

  const total = segments.reduce((s, seg) => s + seg.value, 0);
  if (!total) return null;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.35;
  const innerRadius = radius * 0.6;
  let startAngle = -90;

  /** @param {number} deg */
  const toRad = (deg) => (deg * Math.PI) / 180;

  /** @param {number} angle @param {number} r */
  const pointOnCircle = (angle, r) => ({
    x: cx + r * Math.cos(toRad(angle)),
    y: cy + r * Math.sin(toRad(angle)),
  });

  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const sweep = pct * 360;
    const endAngle = startAngle + sweep;
    const largeArc = sweep > 180 ? 1 : 0;

    const outerStart = pointOnCircle(startAngle, radius);
    const outerEnd = pointOnCircle(endAngle, radius);
    const innerStart = pointOnCircle(endAngle, innerRadius);
    const innerEnd = pointOnCircle(startAngle, innerRadius);

    const midAngle = startAngle + sweep / 2;
    const labelPoint = pointOnCircle(midAngle, radius + 16);

    const d = [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
      "Z",
    ].join(" ");

    const result = { d, color: seg.color, label: seg.label, pct, labelPoint };
    startAngle = endAngle;
    return result;
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {arcs.map((arc, i) => (
        <path key={i} d={arc.d} fill={arc.color} />
      ))}
      {arcs.map((arc, i) => (
        <text
          key={`lbl-${i}`}
          x={arc.labelPoint.x}
          y={arc.labelPoint.y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill="#334155"
          fontWeight="600"
        >
          {Math.round(arc.pct * 100)}%
        </text>
      ))}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="14"
        fill="#1e293b"
        fontWeight="700"
      >
        {total.toLocaleString()}
      </text>
    </svg>
  );
}
