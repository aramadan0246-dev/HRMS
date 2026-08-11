export type LeaveType = "Sick" | "Annual" | "WFH" | "Unpaid" | "Maternity" | "Paternity";
export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export interface ILeaveRequest {
  Id: number;
  EmployeeId: number;
  ApproverId?: number;
  LeaveType: LeaveType;
  FromDate: string;
  ToDate: string;
  Reason?: string;
  Status: LeaveStatus;
  AppliedOn: string;
  ApproverComments?: string;
}

export interface ILeaveBalance {
  Id: number;
  EmployeeId: number;
  Year: number;
  AnnualEntitlement: number;
  LeaveTaken: number;
  SickLeaveEntitlement?: number;
  SickLeaveTaken?: number;
}
