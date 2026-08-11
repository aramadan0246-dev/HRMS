import * as React from "react";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { DatePicker } from "@fluentui/react/lib/DatePicker";
import { TextField } from "@fluentui/react/lib/TextField";
import { PrimaryButton, DefaultButton } from "@fluentui/react/lib/Button";
import { DetailsList, DetailsListLayoutMode, IColumn, SelectionMode } from "@fluentui/react/lib/DetailsList";
import { MessageBar, MessageBarType } from "@fluentui/react/lib/MessageBar";
import { IEmployee, ILeaveRequest, ILeaveBalance, LeaveType } from "../../../../../models";
import { LeaveRequestService, LeaveBalanceService } from "../../../../../services/LeaveService";
import { EmployeeService } from "../../../../../services/EmployeeService";
import { SectionCard } from "../../shared/SectionCard";
import { ProgressRing } from "../../shared/ProgressRing";
import { logError } from "../../shared/logError";
import styles from "./Leave.module.scss";

export interface ILeaveProps {
  employee: IEmployee | undefined;
}

const LEAVE_TYPE_OPTIONS: IDropdownOption[] = [
  { key: "Sick", text: "Sick" },
  { key: "Annual", text: "Annual" },
  { key: "WFH", text: "WFH" },
  { key: "Unpaid", text: "Unpaid" },
  { key: "Maternity", text: "Maternity" },
  { key: "Paternity", text: "Paternity" },
];

export const Leave: React.FC<ILeaveProps> = ({ employee }) => {
  const [balance, setBalance] = React.useState<ILeaveBalance | undefined>(undefined);
  const [myRequests, setMyRequests] = React.useState<ILeaveRequest[]>([]);
  const [pendingOnMe, setPendingOnMe] = React.useState<ILeaveRequest[]>([]);
  const [message, setMessage] = React.useState<string | undefined>(undefined);

  const [leaveType, setLeaveType] = React.useState<LeaveType>("Annual");
  const [fromDate, setFromDate] = React.useState<Date>(new Date());
  const [toDate, setToDate] = React.useState<Date>(new Date());
  const [reason, setReason] = React.useState<string>("");

  const loadRequests = React.useCallback(() => {
    if (!employee) {
      return;
    }
    LeaveRequestService.getByEmployee(employee.Id)
      .then(setMyRequests)
      .catch((err) => {
        logError("Leave: load my requests", err);
        setMyRequests([]);
      });
    if (employee.SystemRole === "Manager" || employee.SystemRole === "HR Admin") {
      LeaveRequestService.getPendingApprovalsFor(employee.Id)
        .then(setPendingOnMe)
        .catch((err) => {
          logError("Leave: load pending approvals", err);
          setPendingOnMe([]);
        });
    }
  }, [employee]);

  React.useEffect(() => {
    if (!employee) {
      return;
    }
    LeaveBalanceService.getForEmployee(employee.Id, new Date().getFullYear())
      .then(setBalance)
      .catch((err) => {
        logError("Leave: load balance", err);
        setBalance(undefined);
      });
    loadRequests();
  }, [employee, loadRequests]);

  const submit = (): void => {
    if (!employee) {
      return;
    }
    LeaveRequestService.add({
      EmployeeId: employee.Id,
      ApproverId: employee.ManagerId,
      LeaveType: leaveType,
      FromDate: fromDate.toISOString().slice(0, 10),
      ToDate: toDate.toISOString().slice(0, 10),
      Reason: reason,
      Status: "Pending",
      AppliedOn: new Date().toISOString(),
    } as Partial<ILeaveRequest>)
      .then(() => {
        setMessage("Leave request submitted.");
        setReason("");
        loadRequests();
      })
      .catch((err) => {
        logError("Leave: submit", err);
        setMessage("Could not submit the leave request. Please try again.");
      });
  };

  const decide = (id: number, approve: boolean): void => {
    const action = approve ? LeaveRequestService.approve(id) : LeaveRequestService.reject(id);
    action.then(loadRequests).catch((err) => logError("Leave: approve/reject", err));
  };

  const myColumns: IColumn[] = [
    { key: "type", name: "Type", fieldName: "LeaveType", minWidth: 70 },
    { key: "from", name: "From", minWidth: 90, onRender: (i: ILeaveRequest) => new Date(i.FromDate).toLocaleDateString() },
    { key: "to", name: "To", minWidth: 90, onRender: (i: ILeaveRequest) => new Date(i.ToDate).toLocaleDateString() },
    { key: "reason", name: "Reason", fieldName: "Reason", minWidth: 160 },
    { key: "status", name: "Status", fieldName: "Status", minWidth: 90 },
  ];

  const [directReportNames, setDirectReportNames] = React.useState<Record<number, string>>({});
  React.useEffect(() => {
    if (pendingOnMe.length === 0) {
      return;
    }
    Promise.all(Array.from(new Set(pendingOnMe.map((p) => p.EmployeeId))).map((id) => EmployeeService.getById(id)))
      .then((emps) => {
        const map: Record<number, string> = {};
        emps.forEach((e) => (map[e.Id] = e.Title));
        setDirectReportNames(map);
      })
      .catch((err) => logError("Leave: resolve approver names", err));
  }, [pendingOnMe]);

  const approvalColumns: IColumn[] = [
    { key: "employee", name: "Employee", minWidth: 120, onRender: (i: ILeaveRequest) => directReportNames[i.EmployeeId] ?? `#${i.EmployeeId}` },
    { key: "type", name: "Type", fieldName: "LeaveType", minWidth: 70 },
    { key: "from", name: "From", minWidth: 90, onRender: (i: ILeaveRequest) => new Date(i.FromDate).toLocaleDateString() },
    { key: "to", name: "To", minWidth: 90, onRender: (i: ILeaveRequest) => new Date(i.ToDate).toLocaleDateString() },
    {
      key: "actions",
      name: "",
      minWidth: 150,
      onRender: (i: ILeaveRequest) => (
        <div className={styles.approvalActions}>
          <PrimaryButton text="Approve" onClick={() => decide(i.Id, true)} />
          <DefaultButton text="Reject" onClick={() => decide(i.Id, false)} />
        </div>
      ),
    },
  ];

  if (!employee) {
    return <p>Loading...</p>;
  }

  const leaveBalance = balance ? Math.max(balance.AnnualEntitlement - balance.LeaveTaken, 0) : 0;
  const sickBalance = balance ? Math.max((balance.SickLeaveEntitlement ?? 0) - (balance.SickLeaveTaken ?? 0), 0) : 0;

  return (
    <div className={styles.grid}>
      {message && (
        <MessageBar messageBarType={MessageBarType.info} onDismiss={() => setMessage(undefined)}>
          {message}
        </MessageBar>
      )}

      <SectionCard title="Leave Summary">
        <div className={styles.ringRow}>
          <ProgressRing value={balance?.LeaveTaken ?? 0} total={balance?.AnnualEntitlement ?? 0} label="Leave Taken" />
          <ProgressRing value={balance?.AnnualEntitlement ?? 0} total={balance?.AnnualEntitlement ?? 0} label="Total Leave" />
          <ProgressRing value={leaveBalance} total={balance?.AnnualEntitlement ?? 0} label="Leave Balance" />
          <ProgressRing value={sickBalance} total={balance?.SickLeaveEntitlement ?? 0} label="Sick Leave" />
        </div>
      </SectionCard>

      <div className={styles.row}>
        <SectionCard title="Leave Application Form">
          <div className={styles.form}>
            <Dropdown
              label="Leave Type"
              options={LEAVE_TYPE_OPTIONS}
              selectedKey={leaveType}
              onChange={(_, o) => setLeaveType(o?.key as LeaveType)}
            />
            <DatePicker label="From Date" value={fromDate} onSelectDate={(d) => d && setFromDate(d)} />
            <DatePicker label="To Date" value={toDate} onSelectDate={(d) => d && setToDate(d)} />
            <TextField label="Reason for Leave" multiline rows={3} value={reason} onChange={(_, v) => setReason(v ?? "")} />
            <PrimaryButton text="Submit" onClick={submit} />
          </div>
        </SectionCard>

        <SectionCard title="Leave Report">
          <DetailsList
            items={myRequests}
            columns={myColumns}
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.none}
            compact
          />
          {myRequests.length === 0 && <p>No leave requests yet.</p>}
        </SectionCard>
      </div>

      {(employee.SystemRole === "Manager" || employee.SystemRole === "HR Admin") && (
        <SectionCard title="Pending Requested on Me">
          <DetailsList
            items={pendingOnMe}
            columns={approvalColumns}
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.none}
            compact
          />
          {pendingOnMe.length === 0 && <p>Nothing pending your approval.</p>}
        </SectionCard>
      )}
    </div>
  );
};
