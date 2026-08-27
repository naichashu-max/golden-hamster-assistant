// 体重曲线：轻量 SVG 折线图，避免引入重型图表库，保持风格可控。
import type { WeightRecord } from '../types';

interface WeightChartProps {
  points: WeightRecord[];
  height?: number;
}

export function WeightChart({ points, height = 180 }: WeightChartProps) {
  if (points.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📉</span>
        还没有体重记录，去记录第一笔吧
      </div>
    );
  }

  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const width = 360;
  const padX = 22;
  const padTop = 16;
  const padBottom = 30;
  const values = sorted.map((p) => p.weight);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const x = (index: number) =>
    sorted.length === 1
      ? width / 2
      : padX + (index * (width - padX * 2)) / (sorted.length - 1);
  const y = (value: number) =>
    padTop + ((max - value) / range) * (height - padTop - padBottom);

  const linePath = sorted
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.weight).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${x(sorted.length - 1).toFixed(1)} ${height - padBottom} L ${x(0).toFixed(1)} ${height - padBottom} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label="体重变化曲线"
    >
      <defs>
        <linearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8C98B" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#E8C98B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#weightArea)" />
      <path
        d={linePath}
        fill="none"
        stroke="#EAA44A"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {sorted.map((p, i) => (
        <circle
          key={p.id}
          cx={x(i)}
          cy={y(p.weight)}
          r="4"
          fill="#fff"
          stroke="#EAA44A"
          strokeWidth="2"
        />
      ))}
      <text x={x(0)} y={height - 8} textAnchor="middle" fill="#9B8B79" fontSize="11">
        {sorted[0].date.slice(5)}
      </text>
      <text
        x={x(sorted.length - 1)}
        y={height - 8}
        textAnchor="middle"
        fill="#9B8B79"
        fontSize="11"
      >
        {sorted[sorted.length - 1].date.slice(5)}
      </text>
    </svg>
  );
}
