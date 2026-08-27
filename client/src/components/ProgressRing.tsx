// 圆形进度环：用于展示健康评分等 0-100 的数值。
import type { ReactNode } from 'react';

interface ProgressRingProps {
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
}

export function ProgressRing({ value, size = 96, stroke = 8, children }: ProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
        <circle
          className="ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-label">{children}</div>
    </div>
  );
}
