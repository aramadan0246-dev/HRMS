import * as React from "react";
import { VerticalBarChart } from "@fluentui/react-charting";
import { PayrollService } from "../../../../../../services/PayrollService";
import { IPayroll } from "../../../../../../models";
import { SectionCard } from "../../../shared/SectionCard";
import { StatTile } from "../../../shared/StatTile";
import { ExportButtons } from "../../../shared/ExportButtons";
import { exportRowsToCsv } from "../../../shared/exportCsv";
import { exportTableToPdf } from "../../../shared/exportPdf";
import { logError } from "../../../shared/logError";
import styles from "../ReportAnalysis.module.scss";

export interface IPayrollWidgetProps {
  title: string;
  /** Restrict to these employees; omit for org-wide. */
  employeeIds?: number[];
  fromDate: Date;
  toDate: Date;
}

const currency = (n: number): string => n.toLocaleString(undefined, { style: "currency", currency: "USD" });

export const PayrollWidget: React.FC<IPayrollWidgetProps> = ({ title, employeeIds, fromDate, toDate }) => {
  const [rows, setRows] = React.useState<IPayroll[]>([]);

  React.useEffect(() => {
    if (employeeIds && employeeIds.length === 0) {
      setRows([]);
      return;
    }
    const filter = employeeIds ? employeeIds.map((id) => `EmployeeId eq ${id}`).join(" or ") : undefined;
    PayrollService.getAll(filter, "PayPeriod")
      .then(setRows)
      .catch((err) => {
        logError(`PayrollWidget (${title}): load`, err);
        setRows([]);
      });
  }, [employeeIds, title]);

  const costByPeriod = React.useMemo(() => {
    const inRange = rows.filter((r) => {
      const parsed = new Date(r.PayPeriod);
      return isNaN(parsed.getTime()) || (parsed >= fromDate && parsed <= toDate);
    });
    const byPeriod: Record<string, number> = {};
    inRange.forEach((r) => {
      byPeriod[r.PayPeriod] = (byPeriod[r.PayPeriod] ?? 0) + r.NetPay;
    });
    return Object.keys(byPeriod).map((period) => ({ period, cost: byPeriod[period] }));
  }, [rows, fromDate, toDate]);

  const totalCost = costByPeriod.reduce((sum, p) => sum + p.cost, 0);

  return (
    <SectionCard
      title={title}
      action={
        <ExportButtons
          onExportCsv={() => exportRowsToCsv(`${title}-payroll`, costByPeriod.map((p) => ({ PayPeriod: p.period, NetPay: p.cost })))}
          onExportPdf={() =>
            exportTableToPdf(
              `${title}-payroll`,
              title,
              ["Pay Period", "Net Pay"],
              costByPeriod.map((p) => [p.period, currency(p.cost)]),
            )
          }
        />
      }
    >
      <div className={styles.statRow}>
        <StatTile iconName="Money" value={currency(totalCost)} label="Total net pay in range" />
      </div>
      {costByPeriod.length > 0 ? (
        <div className={styles.chartWrap}>
          <VerticalBarChart
            chartTitle="Payroll cost by pay period"
            data={costByPeriod.map((p) => ({ x: p.period, y: p.cost }))}
            height={220}
          />
        </div>
      ) : (
        <p>No payroll records in this range.</p>
      )}
    </SectionCard>
  );
};
