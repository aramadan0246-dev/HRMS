import * as React from "react";
import { IconButton } from "@fluentui/react/lib/Button";
import styles from "./ExportButtons.module.scss";

export interface IExportButtonsProps {
  onExportCsv: () => void;
  onExportPdf: () => void;
}

/** Small CSV/PDF export action pair, meant to be passed as a SectionCard's `action` prop. */
export const ExportButtons: React.FC<IExportButtonsProps> = ({ onExportCsv, onExportPdf }) => (
  <div className={styles.exportButtons}>
    <IconButton iconProps={{ iconName: "ExcelDocument" }} title="Export CSV" ariaLabel="Export CSV" onClick={onExportCsv} />
    <IconButton iconProps={{ iconName: "PDF" }} title="Export PDF" ariaLabel="Export PDF" onClick={onExportPdf} />
  </div>
);
