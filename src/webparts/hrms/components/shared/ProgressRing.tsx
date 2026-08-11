import * as React from "react";
import styles from "./ProgressRing.module.scss";

export interface IProgressRingProps {
  value: number;
  total: number;
  label: string;
}

export const ProgressRing: React.FC<IProgressRingProps> = ({ value, total, label }) => {
  const radius = 34;
  const stroke = 8;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(value / total, 1) : 0;
  const offset = circumference * (1 - pct);

  return (
    <div className={styles.wrap}>
      <svg width={radius * 2 + stroke} height={radius * 2 + stroke}>
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke="var(--hrmsBorder)"
          strokeWidth={stroke}
        />
        <circle
          cx="50%"
          cy="50%"
          r={radius}
          fill="none"
          stroke="var(--hrmsAccent)"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${radius + stroke / 2} ${radius + stroke / 2})`}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className={styles.value}>
          {value}
        </text>
      </svg>
      <div className={styles.label}>{label}</div>
    </div>
  );
};
