export type TimesheetLocation = "Office" | "Remote" | "WFH";
export type TimesheetStatus = "Draft" | "Submitted" | "Approved" | "Rejected";

export interface ITimesheet {
  Id: number;
  EmployeeId: number;
  ProjectId: number;
  Date: string;
  WorkLocation: TimesheetLocation;
  HoursInvested: number;
  Description?: string;
  Status: TimesheetStatus;
}
