import { ListService } from "./ListService";
import { IProject, IProjectMember } from "../models";

class ProjectServiceImpl extends ListService<IProject> {
  constructor() {
    super("Projects", ["Id", "ProjectId", "Title", "StartDate", "EndDate", "Status", "Summary", "ProjectLeadId"]);
  }
}

class ProjectMemberServiceImpl extends ListService<IProjectMember> {
  constructor() {
    super("ProjectMembers", ["Id", "ProjectId", "EmployeeId", "RoleOnProject", "AssignedDate"]);
  }

  public async getByProject(projectId: number): Promise<IProjectMember[]> {
    return this.getAll(`ProjectId eq ${projectId}`);
  }

  public async getByEmployee(employeeId: number): Promise<IProjectMember[]> {
    return this.getAll(`EmployeeId eq ${employeeId}`);
  }
}

export const ProjectService = new ProjectServiceImpl();
export const ProjectMemberService = new ProjectMemberServiceImpl();
