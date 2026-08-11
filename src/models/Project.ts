export type ProjectStatus = "Not Started" | "Working" | "Completed" | "Pending" | "On Hold";

export interface IProject {
  Id: number;
  ProjectId: string;
  Title: string;
  StartDate: string;
  EndDate?: string;
  Status: ProjectStatus;
  Summary?: string;
  ProjectLeadId?: number;
}

export interface IProjectMember {
  Id: number;
  ProjectId: number;
  EmployeeId: number;
  RoleOnProject?: string;
  AssignedDate?: string;
}
