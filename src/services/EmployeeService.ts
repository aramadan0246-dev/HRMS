import { ListService } from "./ListService";
import { IEmployee } from "../models";
import { getSP } from "./SPContext";

const SELECT = [
  "Id", "EmployeeId", "Title", "Email", "Designation", "Department",
  "ManagerId", "SystemRole", "WorkLocation", "EmploymentStatus",
  "DateOfBirth", "DateOfJoining", "ProfilePhoto",
];

class EmployeeServiceImpl extends ListService<IEmployee> {
  constructor() {
    super("Employees", SELECT);
  }

  /**
   * Resolves the signed-in SharePoint user to their Employees row (matched on Email).
   * `loginEmail` should be `context.pageContext.user.email` - it's populated reliably by
   * SPFx at page load. `web.currentUser().Email` is used only as a fallback, since that
   * REST property comes back blank on tenants/accounts without an Exchange mailbox.
   */
  public async getCurrentEmployee(loginEmail?: string): Promise<IEmployee | undefined> {
    let email = loginEmail;
    if (!email) {
      const spUser = await getSP().web.currentUser();
      email = spUser.Email;
    }
    if (!email) {
      return undefined;
    }
    const matches = await this.getAll(`Email eq '${email}'`);
    return matches[0];
  }

  public async getDirectReports(managerId: number): Promise<IEmployee[]> {
    return this.getAll(`ManagerId eq ${managerId}`);
  }

  public async getUpcomingBirthdays(withinDays: number): Promise<IEmployee[]> {
    const all = await this.getAll();
    const today = new Date();
    return all.filter((e) => {
      if (!e.DateOfBirth) {
        return false;
      }
      const dob = new Date(e.DateOfBirth);
      const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (nextBirthday < today) {
        nextBirthday.setFullYear(today.getFullYear() + 1);
      }
      const diffDays = (nextBirthday.getTime() - today.getTime()) / 86400000;
      return diffDays >= 0 && diffDays <= withinDays;
    });
  }
}

export const EmployeeService = new EmployeeServiceImpl();
