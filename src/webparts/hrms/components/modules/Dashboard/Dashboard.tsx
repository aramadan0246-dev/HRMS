import * as React from "react";
import { PrimaryButton } from "@fluentui/react/lib/Button";
import { IEmployee, IAttendance, ILeaveBalance, IProject } from "../../../../../models";
import { AttendanceService } from "../../../../../services/AttendanceService";
import { LeaveBalanceService } from "../../../../../services/LeaveService";
import { ProjectMemberService, ProjectService } from "../../../../../services/ProjectService";
import { StatTile } from "../../shared/StatTile";
import { SectionCard } from "../../shared/SectionCard";
import { StatusStrip, IStatusStripDay } from "../../shared/StatusStrip";
import { ProgressRing } from "../../shared/ProgressRing";
import { logError } from "../../shared/logError";
import styles from "./Dashboard.module.scss";

export interface IDashboardProps {
  employee: IEmployee | undefined;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7; // Monday = 0
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  return start;
}

export const Dashboard: React.FC<IDashboardProps> = ({ employee }) => {
  const [today, setToday] = React.useState<IAttendance | undefined>(undefined);
  const [weekDays, setWeekDays] = React.useState<IStatusStripDay[]>([]);
  const [balance, setBalance] = React.useState<ILeaveBalance | undefined>(undefined);
  const [projects, setProjects] = React.useState<IProject[]>([]);

  React.useEffect(() => {
    if (!employee) {
      return;
    }
    const weekStart = startOfWeek(new Date());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    AttendanceService.getForWeek(employee.Id, isoDate(weekStart), isoDate(weekEnd))
      .then((rows) => {
        const byDate: Record<string, IAttendance> = {};
        rows.forEach((r) => (byDate[isoDate(new Date(r.Date))] = r));
        const days: IStatusStripDay[] = DAY_LABELS.map((label, i) => {
          const d = new Date(weekStart);
          d.setDate(weekStart.getDate() + i);
          const rec = byDate[isoDate(d)];
          return { label, status: rec?.Status ?? "Off" };
        });
        setWeekDays(days);
        setToday(byDate[isoDate(new Date())]);
      })
      .catch((err) => {
        logError("Dashboard: load week attendance", err);
        setWeekDays([]);
      });

    LeaveBalanceService.getForEmployee(employee.Id, new Date().getFullYear())
      .then(setBalance)
      .catch((err) => {
        logError("Dashboard: load leave balance", err);
        setBalance(undefined);
      });

    ProjectMemberService.getByEmployee(employee.Id)
      .then((memberships) => Promise.all(memberships.map((m) => ProjectService.getById(m.ProjectId))))
      .then(setProjects)
      .catch((err) => {
        logError("Dashboard: load projects", err);
        setProjects([]);
      });
  }, [employee]);

  const clockIn = (): void => {
    if (!employee) {
      return;
    }
    const nowIso = new Date().toISOString();
    if (today) {
      AttendanceService.update(today.Id, { ClockIn: nowIso, Status: "Present" })
        .then(() => setToday({ ...today, ClockIn: nowIso, Status: "Present" }))
        .catch((err) => logError("Dashboard: clock in (update)", err));
    } else {
      AttendanceService.add({
        EmployeeId: employee.Id,
        Date: isoDate(new Date()),
        ClockIn: nowIso,
        Status: "Present",
      } as Partial<IAttendance>)
        .then(setToday)
        .catch((err) => logError("Dashboard: clock in (create)", err));
    }
  };

  const clockOut = (): void => {
    if (!employee || !today) {
      return;
    }
    const nowIso = new Date().toISOString();
    AttendanceService.update(today.Id, { ClockOut: nowIso })
      .then(() => setToday({ ...today, ClockOut: nowIso }))
      .catch((err) => logError("Dashboard: clock out", err));
  };

  if (!employee) {
    return <p>Loading your dashboard...</p>;
  }

  const leaveBalance = balance ? Math.max(balance.AnnualEntitlement - balance.LeaveTaken, 0) : undefined;

  return (
    <div className={styles.grid}>
      <div className={styles.statRow}>
        <StatTile
          iconName="Clock"
          value={today?.ClockIn ? new Date(today.ClockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
          label="Clock In"
        />
        <StatTile
          iconName="Clock"
          value={today?.ClockOut ? new Date(today.ClockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
          label="Clock out"
        />
        <StatTile iconName="EventDate" value={leaveBalance ?? "--"} label="Available leave" />
      </div>

      <div className={styles.clockActions}>
        <PrimaryButton text="Clock In" onClick={clockIn} disabled={!!today?.ClockIn} />
        <PrimaryButton text="Clock Out" onClick={clockOut} disabled={!today?.ClockIn || !!today?.ClockOut} />
      </div>

      <div className={styles.row}>
        <SectionCard title="Attendance Performance">
          {weekDays.length > 0 ? <StatusStrip days={weekDays} /> : <p>No attendance recorded this week yet.</p>}
        </SectionCard>

        <SectionCard title="Leave Summary">
          {balance ? (
            <div className={styles.ringRow}>
              <ProgressRing value={leaveBalance ?? 0} total={balance.AnnualEntitlement} label="Available leave" />
              <ProgressRing value={balance.LeaveTaken} total={balance.AnnualEntitlement} label="Taken leave" />
              <ProgressRing
                value={(balance.SickLeaveEntitlement ?? 0) - (balance.SickLeaveTaken ?? 0)}
                total={balance.SickLeaveEntitlement ?? 0}
                label="Sick leave"
              />
            </div>
          ) : (
            <p>No leave balance set up yet for this year.</p>
          )}
        </SectionCard>
      </div>

      <SectionCard title="My Current Projects">
        {projects.length > 0 ? (
          <ul className={styles.projectList}>
            {projects.map((p) => (
              <li key={p.Id}>
                <strong>{p.Title}</strong> — {p.Status}
              </li>
            ))}
          </ul>
        ) : (
          <p>You&apos;re not assigned to any projects yet.</p>
        )}
      </SectionCard>
    </div>
  );
};
