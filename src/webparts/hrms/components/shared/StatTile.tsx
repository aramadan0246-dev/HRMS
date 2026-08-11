import * as React from "react";
import { Icon } from "@fluentui/react/lib/Icon";
import styles from "./StatTile.module.scss";

export interface IStatTileProps {
  iconName: string;
  value: string | number;
  label: string;
}

export const StatTile: React.FC<IStatTileProps> = ({ iconName, value, label }) => (
  <div className={styles.tile}>
    <div className={styles.iconWrap}>
      <Icon iconName={iconName} />
    </div>
    <div>
      <div className={styles.value}>{value}</div>
      <div className={styles.label}>{label}</div>
    </div>
  </div>
);
