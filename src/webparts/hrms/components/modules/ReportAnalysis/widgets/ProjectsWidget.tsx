import * as React from "react";
import { DonutChart, IChartProps } from "@fluentui/react-charting";
import { ProjectService, ProjectMemberService } from "../../../../../../services/ProjectService";
import { IProject, ProjectStatus } from "../../../../../../models";
import { SectionCard } from "../../../shared/SectionCard";
import { ExportButtons } from "../../../shared/ExportButtons";
import { exportRowsToCsv } from "../../../shared/exportCsv";
import { exportTableToPdf } from "../../../shared/exportPdf";
import { logError } from "../../../shared/logError";
import styles from "../ReportAnalysis.module.scss";

export interface IProjectsWidgetProps {
  title: string;
  /** Restrict to projects with at least one of these members; omit for org-wide (all projects). */
  employeeIds?: number[];
}

const STATUS_ORDER: ProjectStatus[] = ["Not Started", "Working", "Completed", "Pending", "On Hold"];
const STATUS_COLORS: Record<ProjectStatus, string> = {
  "Not Started": "#8a8886",
  Working: "#0078d4",
  Completed: "#107c10",
  Pending: "#ffb900",
  "On Hold": "#d13438",
};

async function getProjectsForScope(employeeIds?: number[]): Promise<IProject[]> {
  if (!employeeIds) {
    return ProjectService.getAll();
  }
  if (employeeIds.length === 0) {
    return [];
  }
  const memberFilter = employeeIds.map((id) => `EmployeeId eq ${id}`).join(" or ");
  const members = await ProjectMemberService.getAll(memberFilter);
  const projectIds = Array.from(new Set(members.map((m) => m.ProjectId)));
  if (projectIds.length === 0) {
    return [];
  }
  return Promise.all(projectIds.map((id) => ProjectService.getById(id)));
}

export const ProjectsWidget: React.FC<IProjectsWidgetProps> = ({ title, employeeIds }) => {
  const [projects, setProjects] = React.useState<IProject[]>([]);

  React.useEffect(() => {
    getProjectsForScope(employeeIds)
      .then(setProjects)
      .catch((err) => {
        logError(`ProjectsWidget (${title}): load`, err);
        setProjects([]);
      });
  }, [employeeIds, title]);

  const byStatus = STATUS_ORDER.map((status) => ({
    status,
    count: projects.filter((p) => p.Status === status).length,
  })).filter((s) => s.count > 0);

  const chartData: IChartProps = {
    chartTitle: "Projects by status",
    chartData: byStatus.map((s) => ({ legend: s.status, data: s.count, color: STATUS_COLORS[s.status] })),
  };

  return (
    <SectionCard
      title={title}
      action={
        <ExportButtons
          onExportCsv={() => exportRowsToCsv(`${title}-projects`, byStatus.map((s) => ({ Status: s.status, Count: s.count })))}
          onExportPdf={() =>
            exportTableToPdf(`${title}-projects`, title, ["Status", "Count"], byStatus.map((s) => [s.status, s.count]))
          }
        />
      }
    >
      {projects.length > 0 ? (
        <div className={styles.chartWrap}>
          <DonutChart data={chartData} height={220} />
        </div>
      ) : (
        <p>No projects in scope.</p>
      )}
    </SectionCard>
  );
};
