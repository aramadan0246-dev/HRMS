import * as React from "react";
import { DetailsList, DetailsListLayoutMode, IColumn, SelectionMode } from "@fluentui/react/lib/DetailsList";
import { IEmployee, IProject, IProjectMember } from "../../../../../models";
import { ProjectMemberService, ProjectService } from "../../../../../services/ProjectService";
import { SectionCard } from "../../shared/SectionCard";
import { logError } from "../../shared/logError";

export interface IMyProjectProps {
  employee: IEmployee | undefined;
}

interface IRow {
  membership: IProjectMember;
  project: IProject;
}

export const MyProject: React.FC<IMyProjectProps> = ({ employee }) => {
  const [rows, setRows] = React.useState<IRow[]>([]);

  React.useEffect(() => {
    if (!employee) {
      return;
    }
    ProjectMemberService.getByEmployee(employee.Id)
      .then((memberships) =>
        Promise.all(
          memberships.map((m) => ProjectService.getById(m.ProjectId).then((project) => ({ membership: m, project }))),
        ),
      )
      .then(setRows)
      .catch((err) => {
        logError("MyProject: load projects", err);
        setRows([]);
      });
  }, [employee]);

  const columns: IColumn[] = [
    { key: "title", name: "Project", minWidth: 160, onRender: (r: IRow) => r.project.Title },
    { key: "role", name: "My Role", minWidth: 120, onRender: (r: IRow) => r.membership.RoleOnProject ?? "—" },
    { key: "status", name: "Status", minWidth: 100, onRender: (r: IRow) => r.project.Status },
    { key: "start", name: "Start Date", minWidth: 100, onRender: (r: IRow) => new Date(r.project.StartDate).toLocaleDateString() },
    {
      key: "end",
      name: "End Date",
      minWidth: 100,
      onRender: (r: IRow) => (r.project.EndDate ? new Date(r.project.EndDate).toLocaleDateString() : "—"),
    },
    { key: "summary", name: "Summary", minWidth: 240, onRender: (r: IRow) => r.project.Summary ?? "" },
  ];

  if (!employee) {
    return <p>Loading...</p>;
  }

  return (
    <SectionCard title="My Projects">
      <DetailsList
        items={rows}
        columns={columns}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
        compact
      />
      {rows.length === 0 && <p>You&apos;re not assigned to any projects yet.</p>}
    </SectionCard>
  );
};
