export type AttendanceStatus = "Present" | "Absent" | "WFH" | "Half Day" | "Holiday" | "Off";

export interface IAttendance {
  Id: number;
  EmployeeId: number;
  Date: string;
  ClockIn?: string;
  ClockOut?: string;
  Status: AttendanceStatus;
}
