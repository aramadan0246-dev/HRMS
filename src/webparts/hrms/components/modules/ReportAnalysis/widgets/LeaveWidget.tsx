import * as React from "react";
import { DonutChart, IChartProps } from "@fluentui/react-charting";
import { LeaveRequestService, countLeaveDays } from "../../../../../../services/LeaveService";
import { ILeaveRequest, LeaveType } from "../../../../../../models";
import { SectionCard } from "../../../shared/SectionCard";
import { StatTile } from "../../../shared/StatTile";
import { ExportButtons } from "../../../shared/ExportButtons";
import { exportRowsToCsv } from "../../../shared/exportCsv";
import { exportTableToPdf } from "../../../shared/exportPdf";
import { logError } from "../../../shared/logError";
import styles from "../ReportAnalysis.module.scss";

export interface ILeaveWidgetProps {
  title: string;
  /** Restrict to these employees; omit for org-wide. */
  employeeIds?: number[];
  fromDate: Date;
  toDate: Date;
}

const LEAVE_TYPES: LeaveType[] = ["Sick", "Annual", "WFH", "Unpaid", "Maternity", "Paternity"];
const LEAVE_COLORS: Record<LeaveType, string> = {
  Sick: "#d13438",
  Annual: "#0078d4",
  WFH: "#107c10",
  Unpaid: "#8a8886",
  Maternity: "#e3008c",
  Paternity: "#8764b8",
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const LeaveWidget: React.FC<ILeaveWidgetProps> = ({ title, employeeIds, fromDate, toDate }) => {
  const [requests, setRequests] = React.useState<ILeaveRequest[]>([]);

  React.useEffect(() => {
    if (employeeIds && employeeIds.length === 0) {
      setRequests([]);
      return;
    }
    let filter = `Status eq 'Approved' and FromDate ge '${isoDate(fromDate)}' and FromDate le '${isoDate(toDate)}'`;
    if (employeeIds) {
      filter += ` and (${employeeIds.map((id) => `EmployeeId eq ${id}`).join(" or ")})`;
    }
    LeaveRequestService.getAll(filter)
      .then(setRequests)
      .catch((err) => {
        logError(`LeaveWidget (${title}): load`, err);
        setRequests([]);
      });
  }, [employeeIds, fromDate, toDate, title]);

  const daysByType = LEAVE_TYPES.map((type) => ({
    type,
    days: requests.filter((r) => r.LeaveType === type).reduce((sum, r) => sum + countLeaveDays(r), 0),
  })).filter((d) => d.days > 0);

  const totalDays = daysByType.reduce((sum, d) => sum + d.days, 0);

  const chartData: IChartProps = {
    chartTitle: "Leave taken by type",
    chartData: daysByType.map((d) => ({ legend: d.type, data: d.days, color: LEAVE_COLORS[d.type] })),
  };

  return (
    <SectionCard
      title={title}
      action={
        <ExportButtons
          onExportCsv={() => exportRowsToCsv(`${title}-leave`, daysByType.map((d) => ({ Type: d.type, Days: d.days })))}
          onExportPdf={() =>
            exportTableToPdf(`${title}-leave`, title, ["Type", "Days"], daysByType.map((d) => [d.type, d.days]))
          }
        />
      }
    >
      <div className={styles.statRow}>
        <StatTile iconName="EventDate" value={totalDays} label="Leave days taken in range" />
      </div>
      {totalDays > 0 ? (
        <div className={styles.chartWrap}>
          <DonutChart data={chartData} height={220} hideLabels={false} />
        </div>
      ) : (
        <p>No approved leave in this range.</p>
      )}
    </SectionCard>
  );
};
