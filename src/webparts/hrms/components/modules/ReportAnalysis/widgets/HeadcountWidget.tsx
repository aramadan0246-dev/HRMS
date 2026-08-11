import * as React from "react";
import { VerticalBarChart } from "@fluentui/react-charting";
import { IEmployee } from "../../../../../../models";
import { SectionCard } from "../../../shared/SectionCard";
import { StatTile } from "../../../shared/StatTile";
import { ExportButtons } from "../../../shared/ExportButtons";
import { exportRowsToCsv } from "../../../shared/exportCsv";
import { exportTableToPdf } from "../../../shared/exportPdf";
import styles from "../ReportAnalysis.module.scss";

export interface IHeadcountWidgetProps {
  employees: IEmployee[];
}

export const HeadcountWidget: React.FC<IHeadcountWidgetProps> = ({ employees }) => {
  const byDepartment = React.useMemo(() => {
    const counts: Record<string, number> = {};
    employees.forEach((e) => {
      const dept = e.Department || "Unassigned";
      counts[dept] = (counts[dept] ?? 0) + 1;
    });
    return Object.keys(counts)
      .sort()
      .map((dept) => ({ dept, count: counts[dept] }));
  }, [employees]);

  const activeCount = employees.filter((e) => e.EmploymentStatus === "Active").length;
  const inactiveCount = employees.length - activeCount;

  return (
    <SectionCard
      title="Headcount by Department"
      action={
        <ExportButtons
          onExportCsv={() => exportRowsToCsv("headcount-by-department", byDepartment.map((d) => ({ Department: d.dept, Count: d.count })))}
          onExportPdf={() =>
            exportTableToPdf(
              "headcount-by-department",
              "Headcount by Department",
              ["Department", "Count"],
              byDepartment.map((d) => [d.dept, d.count]),
            )
          }
        />
      }
    >
      <div className={styles.statRow}>
        <StatTile iconName="Contact" value={employees.length} label="Total employees" />
        <StatTile iconName="SkypeCircleCheck" value={activeCount} label="Active" />
        <StatTile iconName="Blocked2" value={inactiveCount} label="Inactive / On Leave" />
      </div>
      <div className={styles.chartWrap}>
        <VerticalBarChart chartTitle="Employees by department" data={byDepartment.map((d) => ({ x: d.dept, y: d.count }))} height={220} />
      </div>
    </SectionCard>
  );
};
