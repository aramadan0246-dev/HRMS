import * as React from "react";
import { VerticalBarChart } from "@fluentui/react-charting";
import { AttendanceService } from "../../../../../../services/AttendanceService";
import { IAttendance, AttendanceStatus } from "../../../../../../models";
import { SectionCard } from "../../../shared/SectionCard";
import { StatTile } from "../../../shared/StatTile";
import { ExportButtons } from "../../../shared/ExportButtons";
import { exportRowsToCsv } from "../../../shared/exportCsv";
import { exportTableToPdf } from "../../../shared/exportPdf";
import { logError } from "../../../shared/logError";
import styles from "../ReportAnalysis.module.scss";

export interface IAttendanceWidgetProps {
  title: string;
  /** Restrict to these employees; omit for org-wide. */
  employeeIds?: number[];
  fromDate: Date;
  toDate: Date;
}

const STATUS_ORDER: AttendanceStatus[] = ["Present", "Absent", "WFH", "Half Day", "Holiday", "Off"];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const AttendanceWidget: React.FC<IAttendanceWidgetProps> = ({ title, employeeIds, fromDate, toDate }) => {
  const [rows, setRows] = React.useState<IAttendance[]>([]);

  React.useEffect(() => {
    if (employeeIds && employeeIds.length === 0) {
      setRows([]);
      return;
    }
    let filter = `Date ge '${isoDate(fromDate)}' and Date le '${isoDate(toDate)}'`;
    if (employeeIds) {
      filter += ` and (${employeeIds.map((id) => `EmployeeId eq ${id}`).join(" or ")})`;
    }
    AttendanceService.getAll(filter, "Date")
      .then(setRows)
      .catch((err) => {
        logError(`AttendanceWidget (${title}): load`, err);
        setRows([]);
      });
  }, [employeeIds, fromDate, toDate, title]);

  const counts = STATUS_ORDER.map((status) => ({
    status,
    count: rows.filter((r) => r.Status === status).length,
  }));
  const presentCount = counts.find((c) => c.status === "Present")?.count ?? 0;
  const attendanceRate = rows.length > 0 ? Math.round((presentCount / rows.length) * 100) : 0;

  return (
    <SectionCard
      title={title}
      action={
        <ExportButtons
          onExportCsv={() =>
            exportRowsToCsv(
              `${title}-attendance`,
              counts.map((c) => ({ Status: c.status, Count: c.count })),
            )
          }
          onExportPdf={() =>
            exportTableToPdf(
              `${title}-attendance`,
              title,
              ["Status", "Count"],
              counts.map((c) => [c.status, c.count]),
            )
          }
        />
      }
    >
      <div className={styles.statRow}>
        <StatTile iconName="Clock" value={`${attendanceRate}%`} label="Attendance rate" />
        <StatTile iconName="EventDate" value={rows.length} label="Records in range" />
      </div>
      <div className={styles.chartWrap}>
        <VerticalBarChart chartTitle="Attendance by status" data={counts.map((c) => ({ x: c.status, y: c.count }))} height={220} />
      </div>
    </SectionCard>
  );
};
