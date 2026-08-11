import * as React from "react";
import { LineChart, IChartProps } from "@fluentui/react-charting";
import { TimesheetService } from "../../../../../../services/TimesheetService";
import { ITimesheet } from "../../../../../../models";
import { SectionCard } from "../../../shared/SectionCard";
import { StatTile } from "../../../shared/StatTile";
import { ExportButtons } from "../../../shared/ExportButtons";
import { exportRowsToCsv } from "../../../shared/exportCsv";
import { exportTableToPdf } from "../../../shared/exportPdf";
import { logError } from "../../../shared/logError";
import styles from "../ReportAnalysis.module.scss";

export interface ITimesheetWidgetProps {
  title: string;
  /** Restrict to these employees; omit for org-wide. */
  employeeIds?: number[];
  fromDate: Date;
  toDate: Date;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const TimesheetWidget: React.FC<ITimesheetWidgetProps> = ({ title, employeeIds, fromDate, toDate }) => {
  const [rows, setRows] = React.useState<ITimesheet[]>([]);

  React.useEffect(() => {
    if (employeeIds && employeeIds.length === 0) {
      setRows([]);
      return;
    }
    let filter = `Date ge '${isoDate(fromDate)}' and Date le '${isoDate(toDate)}'`;
    if (employeeIds) {
      filter += ` and (${employeeIds.map((id) => `EmployeeId eq ${id}`).join(" or ")})`;
    }
    TimesheetService.getAll(filter, "Date")
      .then(setRows)
      .catch((err) => {
        logError(`TimesheetWidget (${title}): load`, err);
        setRows([]);
      });
  }, [employeeIds, fromDate, toDate, title]);

  const hoursByDate = React.useMemo(() => {
    const byDate: Record<string, number> = {};
    rows.forEach((r) => {
      const key = isoDate(new Date(r.Date));
      byDate[key] = (byDate[key] ?? 0) + r.HoursInvested;
    });
    return Object.keys(byDate)
      .sort()
      .map((date) => ({ date, hours: byDate[date] }));
  }, [rows]);

  const totalHours = hoursByDate.reduce((sum, d) => sum + d.hours, 0);

  const chartData: IChartProps = {
    chartTitle: "Hours logged over time",
    lineChartData: [
      {
        legend: "Hours",
        data: hoursByDate.map((d) => ({ x: new Date(d.date), y: d.hours })),
      },
    ],
  };

  return (
    <SectionCard
      title={title}
      action={
        <ExportButtons
          onExportCsv={() => exportRowsToCsv(`${title}-timesheet`, hoursByDate.map((d) => ({ Date: d.date, Hours: d.hours })))}
          onExportPdf={() =>
            exportTableToPdf(`${title}-timesheet`, title, ["Date", "Hours"], hoursByDate.map((d) => [d.date, d.hours]))
          }
        />
      }
    >
      <div className={styles.statRow}>
        <StatTile iconName="Clock" value={totalHours.toFixed(1)} label="Total hours in range" />
      </div>
      {hoursByDate.length > 0 ? (
        <div className={styles.chartWrap}>
          <LineChart data={chartData} height={220} />
        </div>
      ) : (
        <p>No timesheet entries in this range.</p>
      )}
    </SectionCard>
  );
};
