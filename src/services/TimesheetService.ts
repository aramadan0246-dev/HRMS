import { ListService } from "./ListService";
import { ITimesheet } from "../models";

class TimesheetServiceImpl extends ListService<ITimesheet> {
  constructor() {
    super("Timesheets", ["Id", "EmployeeId", "ProjectId", "Date", "WorkLocation", "HoursInvested", "Description", "Status"]);
  }

  public async getByEmployee(employeeId: number): Promise<ITimesheet[]> {
    return this.getAll(`EmployeeId eq ${employeeId}`, "Date", false);
  }

  /** Timesheets submitted by anyone this employee manages (approver inbox). */
  public async getPendingApprovalsFor(employeeIds: number[]): Promise<ITimesheet[]> {
    if (employeeIds.length === 0) {
      return [];
    }
    const filter = employeeIds.map((id) => `EmployeeId eq ${id}`).join(" or ");
    return this.getAll(`Status eq 'Submitted' and (${filter})`, "Date", false);
  }
}

export const TimesheetService = new TimesheetServiceImpl();
