import * as React from "react";
import { DetailsList, DetailsListLayoutMode, IColumn, SelectionMode } from "@fluentui/react/lib/DetailsList";
import { Link } from "@fluentui/react/lib/Link";
import { IEmployee, IPayroll } from "../../../../../models";
import { PayrollService } from "../../../../../services/PayrollService";
import { SectionCard } from "../../shared/SectionCard";
import { PayrollAdminPanel } from "./PayrollAdminPanel";
import { logError } from "../../shared/logError";
import styles from "./Payroll.module.scss";

export interface IPayrollProps {
  employee: IEmployee | undefined;
}

const currency = (n: number | undefined): string => (n ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

export const Payroll: React.FC<IPayrollProps> = ({ employee }) => {
  const [payslips, setPayslips] = React.useState<IPayroll[]>([]);

  React.useEffect(() => {
    if (!employee) {
      return;
    }
    PayrollService.getByEmployee(employee.Id)
      .then(setPayslips)
      .catch((err) => {
        logError("Payroll: load my payslips", err);
        setPayslips([]);
      });
  }, [employee]);

  const columns: IColumn[] = [
    { key: "period", name: "Pay Period", fieldName: "PayPeriod", minWidth: 100 },
    { key: "basic", name: "Basic", minWidth: 90, onRender: (p: IPayroll) => currency(p.BasicSalary) },
    { key: "allowances", name: "Allowances", minWidth: 90, onRender: (p: IPayroll) => currency(p.Allowances) },
    { key: "deductions", name: "Deductions", minWidth: 90, onRender: (p: IPayroll) => currency(p.Deductions) },
    { key: "net", name: "Net Pay", minWidth: 90, onRender: (p: IPayroll) => currency(p.NetPay) },
    { key: "status", name: "Status", fieldName: "PaymentStatus", minWidth: 80 },
    {
      key: "payslip",
      name: "Payslip",
      minWidth: 80,
      onRender: (p: IPayroll) => (p.PayslipUrl ? <Link href={p.PayslipUrl} target="_blank">View</Link> : "—"),
    },
  ];

  if (!employee) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.grid}>
      <SectionCard title="My Payroll History">
        <DetailsList
          items={payslips}
          columns={columns}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
          compact
        />
        {payslips.length === 0 && <p>No payslips published yet.</p>}
      </SectionCard>

      {employee.SystemRole === "Payroll Admin" && <PayrollAdminPanel />}
    </div>
  );
};
