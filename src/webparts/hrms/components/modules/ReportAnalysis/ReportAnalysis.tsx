import * as React from "react";
import { DefaultButton } from "@fluentui/react/lib/Button";
import { IEmployee } from "../../../../../models";
import { EmployeeService } from "../../../../../services/EmployeeService";
import { SectionCard } from "../../shared/SectionCard";
import { exportElementToPdf } from "../../shared/exportPdf";
import { logError } from "../../shared/logError";
import { ReportFilterBar, IReportFilters } from "./ReportFilterBar";
import { AttendanceWidget } from "./widgets/AttendanceWidget";
import { LeaveWidget } from "./widgets/LeaveWidget";
import { TimesheetWidget } from "./widgets/TimesheetWidget";
import { PayrollWidget } from "./widgets/PayrollWidget";
import { HeadcountWidget } from "./widgets/HeadcountWidget";
import { ProjectsWidget } from "./widgets/ProjectsWidget";
import { PolicyWidget } from "./widgets/PolicyWidget";
import styles from "./ReportAnalysis.module.scss";

export interface IReportAnalysisProps {
  employee: IEmployee | undefined;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export const ReportAnalysis: React.FC<IReportAnalysisProps> = ({ employee }) => {
  const reportRef = React.useRef<HTMLDivElement>(null);
  const [filters, setFilters] = React.useState<IReportFilters>({
    fromDate: startOfMonth(new Date()),
    toDate: endOfMonth(new Date()),
  });
  const [directReportIds, setDirectReportIds] = React.useState<number[]>([]);
  const [allEmployees, setAllEmployees] = React.useState<IEmployee[]>([]);

  const isManager = employee?.SystemRole === "Manager";
  const isHrAdmin = employee?.SystemRole === "HR Admin";
  const isPayrollAdmin = employee?.SystemRole === "Payroll Admin";

  React.useEffect(() => {
    if (!employee) {
      return;
    }
    if (isManager) {
      EmployeeService.getDirectReports(employee.Id)
        .then((reports) => setDirectReportIds(reports.map((r) => r.Id)))
        .catch((err) => {
          logError("ReportAnalysis: load direct reports", err);
          setDirectReportIds([]);
        });
    }
    if (isHrAdmin) {
      EmployeeService.getAll()
        .then(setAllEmployees)
        .catch((err) => {
          logError("ReportAnalysis: load employees", err);
          setAllEmployees([]);
        });
    }
  }, [employee, isManager, isHrAdmin]);

  const departments = React.useMemo(
    () => Array.from(new Set(allEmployees.map((e) => e.Department).filter((d): d is string => !!d))).sort(),
    [allEmployees],
  );

  const orgScopedEmployees = React.useMemo(
    () => (filters.department ? allEmployees.filter((e) => e.Department === filters.department) : allEmployees),
    [allEmployees, filters.department],
  );
  const orgScopedEmployeeIds = filters.department ? orgScopedEmployees.map((e) => e.Id) : undefined;

  const exportFullReport = (): void => {
    if (reportRef.current) {
      exportElementToPdf("report-and-analysis", reportRef.current).catch((err) => logError("ReportAnalysis: export PDF", err));
    }
  };

  if (!employee) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.grid} ref={reportRef}>
      <div className={styles.topBar}>
        <ReportFilterBar filters={filters} onChange={setFilters} departments={isHrAdmin ? departments : undefined} />
        <DefaultButton text="Export Full Report (PDF)" iconProps={{ iconName: "PDF" }} onClick={exportFullReport} />
      </div>

      <SectionCard title="My Analytics">
        <div className={styles.widgetRow}>
          <AttendanceWidget title="My Attendance" employeeIds={[employee.Id]} fromDate={filters.fromDate} toDate={filters.toDate} />
          <LeaveWidget title="My Leave" employeeIds={[employee.Id]} fromDate={filters.fromDate} toDate={filters.toDate} />
        </div>
        <TimesheetWidget title="My Timesheet" employeeIds={[employee.Id]} fromDate={filters.fromDate} toDate={filters.toDate} />
      </SectionCard>

      {isManager && (
        <SectionCard title="My Team">
          <div className={styles.widgetRow}>
            <AttendanceWidget title="Team Attendance" employeeIds={directReportIds} fromDate={filters.fromDate} toDate={filters.toDate} />
            <LeaveWidget title="Team Leave" employeeIds={directReportIds} fromDate={filters.fromDate} toDate={filters.toDate} />
          </div>
          <div className={styles.widgetRow}>
            <TimesheetWidget title="Team Timesheet" employeeIds={directReportIds} fromDate={filters.fromDate} toDate={filters.toDate} />
            <ProjectsWidget title="Team Projects" employeeIds={directReportIds} />
          </div>
        </SectionCard>
      )}

      {isHrAdmin && (
        <SectionCard title="Organization">
          <div className={styles.widgetRow}>
            <AttendanceWidget
              title="Org Attendance"
              employeeIds={orgScopedEmployeeIds}
              fromDate={filters.fromDate}
              toDate={filters.toDate}
            />
            <LeaveWidget title="Org Leave" employeeIds={orgScopedEmployeeIds} fromDate={filters.fromDate} toDate={filters.toDate} />
          </div>
          <div className={styles.widgetRow}>
            <TimesheetWidget
              title="Org Timesheet"
              employeeIds={orgScopedEmployeeIds}
              fromDate={filters.fromDate}
              toDate={filters.toDate}
            />
            <ProjectsWidget title="Org Projects" employeeIds={orgScopedEmployeeIds} />
          </div>
          <div className={styles.widgetRow}>
            <HeadcountWidget employees={orgScopedEmployees} />
            <PolicyWidget />
          </div>
        </SectionCard>
      )}

      {isPayrollAdmin && (
        <SectionCard title="Payroll">
          <PayrollWidget title="Org Payroll" fromDate={filters.fromDate} toDate={filters.toDate} />
        </SectionCard>
      )}
    </div>
  );
};
