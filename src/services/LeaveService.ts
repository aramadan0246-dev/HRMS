import { ListService } from "./ListService";
import { ILeaveRequest, ILeaveBalance } from "../models";

class LeaveRequestServiceImpl extends ListService<ILeaveRequest> {
  constructor() {
    super("LeaveRequests", [
      "Id", "EmployeeId", "ApproverId", "LeaveType", "FromDate", "ToDate",
      "Reason", "Status", "AppliedOn", "ApproverComments",
    ]);
  }

  public async getByEmployee(employeeId: number): Promise<ILeaveRequest[]> {
    return this.getAll(`EmployeeId eq ${employeeId}`, "AppliedOn", false);
  }

  public async getPendingApprovalsFor(approverId: number): Promise<ILeaveRequest[]> {
    return this.getAll(`ApproverId eq ${approverId} and Status eq 'Pending'`, "AppliedOn", false);
  }

  public async approve(id: number, comments?: string): Promise<void> {
    const request = await this.getById(id);
    await this.update(id, { Status: "Approved", ApproverComments: comments } as Partial<ILeaveRequest>);
    await applyApprovedLeaveToBalance(request);
  }

  public async reject(id: number, comments?: string): Promise<void> {
    await this.update(id, { Status: "Rejected", ApproverComments: comments } as Partial<ILeaveRequest>);
  }
}

class LeaveBalanceServiceImpl extends ListService<ILeaveBalance> {
  constructor() {
    super("LeaveBalances", ["Id", "EmployeeId", "Year", "AnnualEntitlement", "LeaveTaken", "SickLeaveEntitlement", "SickLeaveTaken"]);
  }

  public async getForEmployee(employeeId: number, year: number): Promise<ILeaveBalance | undefined> {
    const rows = await this.getAll(`EmployeeId eq ${employeeId} and Year eq ${year}`);
    return rows[0];
  }
}

export const LeaveRequestService = new LeaveRequestServiceImpl();
export const LeaveBalanceService = new LeaveBalanceServiceImpl();

/** Inclusive day count, e.g. Mon-Mon = 1 day, Mon-Tue = 2 days. */
export function countLeaveDays(request: ILeaveRequest): number {
  const from = new Date(request.FromDate);
  const to = new Date(request.ToDate);
  return Math.round((to.getTime() - from.getTime()) / 86400000) + 1;
}

/**
 * Approving a request only records its Status - the employee's LeaveBalance row
 * has to be updated separately so "taken" reflects approved leave.
 */
async function applyApprovedLeaveToBalance(request: ILeaveRequest): Promise<void> {
  if (request.LeaveType !== "Annual" && request.LeaveType !== "Sick") {
    return;
  }
  const year = new Date(request.FromDate).getFullYear();
  const balance = await LeaveBalanceService.getForEmployee(request.EmployeeId, year);
  if (!balance) {
    return;
  }
  const days = countLeaveDays(request);
  if (request.LeaveType === "Annual") {
    await LeaveBalanceService.update(balance.Id, { LeaveTaken: balance.LeaveTaken + days } as Partial<ILeaveBalance>);
  } else {
    await LeaveBalanceService.update(balance.Id, {
      SickLeaveTaken: (balance.SickLeaveTaken ?? 0) + days,
    } as Partial<ILeaveBalance>);
  }
}
