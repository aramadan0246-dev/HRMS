import * as React from "react";
import { DetailsList, DetailsListLayoutMode, IColumn, SelectionMode } from "@fluentui/react/lib/DetailsList";
import { IEmployee, IAttendance } from "../../../../../models";
import { AttendanceService } from "../../../../../services/AttendanceService";
import { SectionCard } from "../../shared/SectionCard";
import { StatusStrip, IStatusStripDay } from "../../shared/StatusStrip";
import { logError } from "../../shared/logError";

export interface IAttendanceProps {
  employee: IEmployee | undefined;
}

export const Attendance: React.FC<IAttendanceProps> = ({ employee }) => {
  const [history, setHistory] = React.useState<IAttendance[]>([]);

  React.useEffect(() => {
    if (!employee) {
      return;
    }
    AttendanceService.getByEmployee(employee.Id)
      .then(setHistory)
      .catch((err) => {
        logError("Attendance: load history", err);
        setHistory([]);
      });
  }, [employee]);

  const recentDays: IStatusStripDay[] = history
    .slice(0, 7)
    .reverse()
    .map((a) => ({
      label: new Date(a.Date).toLocaleDateString(undefined, { weekday: "short" }),
      status: a.Status,
    }));

  const columns: IColumn[] = [
    { key: "date", name: "Date", minWidth: 100, onRender: (a: IAttendance) => new Date(a.Date).toLocaleDateString() },
    {
      key: "in",
      name: "Clock In",
      minWidth: 90,
      onRender: (a: IAttendance) => (a.ClockIn ? new Date(a.ClockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"),
    },
    {
      key: "out",
      name: "Clock Out",
      minWidth: 90,
      onRender: (a: IAttendance) => (a.ClockOut ? new Date(a.ClockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"),
    },
    { key: "status", name: "Status", fieldName: "Status", minWidth: 90 },
  ];

  if (!employee) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <SectionCard title="Last 7 Days">
        {recentDays.length > 0 ? <StatusStrip days={recentDays} /> : <p>No attendance recorded yet.</p>}
      </SectionCard>
      <div style={{ height: 18 }} />
      <SectionCard title="Attendance History">
        <DetailsList
          items={history}
          columns={columns}
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
          compact
        />
        {history.length === 0 && <p>No attendance records yet. Clock in from the Dashboard to get started.</p>}
      </SectionCard>
    </div>
  );
};
