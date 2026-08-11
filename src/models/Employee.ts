export type SystemRole = "Employee" | "Manager" | "HR Admin" | "Payroll Admin";
export type WorkLocation = "Office" | "Remote" | "WFH";
export type EmploymentStatus = "Active" | "Inactive" | "On Leave";

export interface IEmployee {
  Id: number;
  EmployeeId: string;
  Title: string;
  Email: string;
  Designation?: string;
  Department?: string;
  ManagerId?: number;
  SystemRole: SystemRole;
  WorkLocation?: WorkLocation;
  EmploymentStatus: EmploymentStatus;
  DateOfBirth?: string;
  DateOfJoining?: string;
  ProfilePhoto?: string;
}
