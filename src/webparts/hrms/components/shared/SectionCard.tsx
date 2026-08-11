import * as React from "react";
import styles from "./SectionCard.module.scss";

export interface ISectionCardProps {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const SectionCard: React.FC<ISectionCardProps> = ({ title, children, action }) => (
  <section className={styles.card}>
    <header className={styles.header}>
      <span>{title}</span>
      {action}
    </header>
    <div className={styles.body}>{children}</div>
  </section>
);
