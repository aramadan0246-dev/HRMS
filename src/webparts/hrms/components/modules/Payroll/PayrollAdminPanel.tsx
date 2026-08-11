import * as React from "react";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { TextField } from "@fluentui/react/lib/TextField";
import { PrimaryButton } from "@fluentui/react/lib/Button";
import { DetailsList, DetailsListLayoutMode, IColumn, SelectionMode } from "@fluentui/react/lib/DetailsList";
import { Link } from "@fluentui/react/lib/Link";
import { MessageBar, MessageBarType } from "@fluentui/react/lib/MessageBar";
import { IEmployee, IPayroll, PaymentStatus } from "../../../../../models";
import { PayrollService } from "../../../../../services/PayrollService";
import { EmployeeService } from "../../../../../services/EmployeeService";
import { SectionCard } from "../../shared/SectionCard";
import { logError } from "../../shared/logError";
import styles from "./Payroll.module.scss";

const currency = (n: number | undefined): string => (n ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" });

const STATUS_OPTIONS: IDropdownOption[] = [
  { key: "Pending", text: "Pending" },
  { key: "Paid", text: "Paid" },
];

export const PayrollAdminPanel: React.FC = () => {
  const [employees, setEmployees] = React.useState<IEmployee[]>([]);
  const [allPayroll, setAllPayroll] = React.useState<IPayroll[]>([]);
  const [message, setMessage] = React.useState<string | undefined>(undefined);

  const [employeeId, setEmployeeId] = React.useState<number | undefined>(undefined);
  const [payPeriod, setPayPeriod] = React.useState<string>("");
  const [basicSalary, setBasicSalary] = React.useState<string>("");
  const [allowances, setAllowances] = React.useState<string>("");
  const [deductions, setDeductions] = React.useState<string>("");
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus>("Pending");

  const loadAll = React.useCallback(() => {
    PayrollService.getAll(undefined, "PayPeriod desc")
      .then(setAllPayroll)
      .catch((err) => {
        logError("PayrollAdminPanel: load all payroll", err);
        setAllPayroll([]);
      });
  }, []);

  React.useEffect(() => {
    EmployeeService.getAll()
      .then(setEmployees)
      .catch((err) => {
        logError("PayrollAdminPanel: load employees", err);
        setEmployees([]);
      });
    loadAll();
  }, [loadAll]);

  const employeeOptions: IDropdownOption[] = employees.map((e) => ({ key: e.Id, text: `${e.Title} (${e.EmployeeId})` }));
  const employeeName = (id: number): string => employees.find((e) => e.Id === id)?.Title ?? `#${id}`;

  const resetForm = (): void => {
    setEmployeeId(undefined);
    setPayPeriod("");
    setBasicSalary("");
    setAllowances("");
    setDeductions("");
    setPaymentStatus("Pending");
  };

  const submit = (): void => {
    if (!employeeId || !payPeriod || !basicSalary) {
      setMessage("Employee, pay period, and basic salary are required.");
      return;
    }
    const basic = parseFloat(basicSalary);
    const allow = parseFloat(allowances || "0");
    const deduct = parseFloat(deductions || "0");
    PayrollService.add({
      EmployeeId: employeeId,
      PayPeriod: payPeriod,
      BasicSalary: basic,
      Allowances: allow,
      Deductions: deduct,
      NetPay: basic + allow - deduct,
      PaymentStatus: paymentStatus,
    } as Partial<IPayroll>)
      .then(() => {
        setMessage("Payslip added.");
        resetForm();
        loadAll();
      })
      .catch((err) => {
        logError("PayrollAdminPanel: add payslip", err);
        setMessage("Could not add the payslip. Please try again.");
      });
  };

  const columns: IColumn[] = [
    { key: "employee", name: "Employee", minWidth: 140, onRender: (p: IPayroll) => employeeName(p.EmployeeId) },
    { key: "period", name: "Pay Period", fieldName: "PayPeriod", minWidth: 100 },
    { key: "basic", name: "Basic", minWidth: 90, onRender: (p: IPayroll) => currency(p.BasicSalary) },
    { key: "net", name: "Net Pay", minWidth: 90, onRender: (p: IPayroll) => currency(p.NetPay) },
    { key: "status", name: "Status", fieldName: "PaymentStatus", minWidth: 80 },
    {
      key: "payslip",
      name: "Payslip",
      minWidth: 80,
      onRender: (p: IPayroll) => (p.PayslipUrl ? <Link href={p.PayslipUrl} target="_blank">View</Link> : "—"),
    },
  ];

  return (
    <div className={styles.adminGrid}>
      {message && (
        <MessageBar messageBarType={MessageBarType.info} onDismiss={() => setMessage(undefined)}>
          {message}
        </MessageBar>
      )}

      <SectionCard title="Add Payslip">
        <div className={styles.form}>
          <Dropdown
            label="Employee"
            options={employeeOptions}
            selectedKey={employeeId}
            onChange={(_, o) => setEmployeeId(o?.key as number)}
            placeholder="Select an employee"
          />
          <TextField label="Pay Period" placeholder="e.g. Jul-2026" value={payPeriod} onChange={(_, v) => setPayPeriod(v ?? "")} />
          <TextField label="Basic Salary" type="number" value={basicSalary} onChange={(_, v) => setBasicSalary(v ?? "")} />
          <TextField label="Allowances" type="number" value={allowances} onChange={(_, v) => setAllowances(v ?? "")} />
          <TextField label="Deductions" type="number" value={deductions} onChange={(_, v) => setDeductions(v ?? "")} />
          <Dropdown
            label="Payment Status"
            options={STATUS_OPTIONS}
            selectedKey={paymentStatus}
            onChange={(_, o) => setPaymentStatus(o?.key as PaymentStatus)}
          />
          <PrimaryButton text="Save" onClick={submit} />
        </div>
      </SectionCard>

      <SectionCard title="All Employees — Payroll">
        <DetailsList
          items={allPayroll}
          columns={columns}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
          compact
        />
        {allPayroll.length === 0 && <p>No payslips recorded yet.</p>}
      </SectionCard>
    </div>
  );
};
