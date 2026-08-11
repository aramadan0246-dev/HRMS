import * as React from "react";
import styles from "./StatusStrip.module.scss";

export interface IStatusStripDay {
  label: string;
  status: string;
}

const STATUS_COLOR: Record<string, string> = {
  Present: "#1f6f6b",
  Absent: "#c65b5b",
  WFH: "#9c6b30",
  "Half Day": "#c9a227",
  Holiday: "#6a6fc6",
  Off: "#9aa19d",
};

export interface IStatusStripProps {
  days: IStatusStripDay[];
}

/** Compact week-at-a-glance strip: one colored cell per day, colored by attendance status. */
export const StatusStrip: React.FC<IStatusStripProps> = ({ days }) => {
  const usedStatuses = Array.from(new Set(days.map((d) => d.status)));

  return (
    <div>
      <div className={styles.strip}>
        {days.map((d, i) => (
          <div key={i} className={styles.cellWrap}>
            <div className={styles.cell} style={{ background: STATUS_COLOR[d.status] ?? "#c7d0cb" }} title={d.status} />
            <span className={styles.dayLabel}>{d.label}</span>
          </div>
        ))}
      </div>
      <div className={styles.legend}>
        {usedStatuses.map((s) => (
          <span key={s} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: STATUS_COLOR[s] ?? "#c7d0cb" }} />
            {s}
          </span>
        ))}
      </div>
    </div>
  );
};
