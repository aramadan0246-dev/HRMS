import { ListService } from "./ListService";
import { IAttendance } from "../models";

class AttendanceServiceImpl extends ListService<IAttendance> {
  constructor() {
    super("Attendance", ["Id", "EmployeeId", "Date", "ClockIn", "ClockOut", "Status"]);
  }

  public async getByEmployee(employeeId: number): Promise<IAttendance[]> {
    return this.getAll(`EmployeeId eq ${employeeId}`, "Date", false);
  }

  public async getForWeek(employeeId: number, weekStartIso: string, weekEndIso: string): Promise<IAttendance[]> {
    return this.getAll(
      `EmployeeId eq ${employeeId} and Date ge '${weekStartIso}' and Date le '${weekEndIso}'`,
      "Date",
    );
  }
}

export const AttendanceService = new AttendanceServiceImpl();
