import * as React from "react";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import { DatePicker } from "@fluentui/react/lib/DatePicker";
import { TextField } from "@fluentui/react/lib/TextField";
import { PrimaryButton, DefaultButton } from "@fluentui/react/lib/Button";
import { DetailsList, DetailsListLayoutMode, IColumn, SelectionMode } from "@fluentui/react/lib/DetailsList";
import { MessageBar, MessageBarType } from "@fluentui/react/lib/MessageBar";
import { IEmployee, IProject, ITimesheet, TimesheetLocation } from "../../../../../models";
import { TimesheetService } from "../../../../../services/TimesheetService";
import { ProjectMemberService, ProjectService } from "../../../../../services/ProjectService";
import { SectionCard } from "../../shared/SectionCard";
import { logError } from "../../shared/logError";
import styles from "./Timesheet.module.scss";

export interface ITimesheetProps {
  employee: IEmployee | undefined;
}

const LOCATION_OPTIONS: IDropdownOption[] = [
  { key: "Office", text: "Office" },
  { key: "Remote", text: "Remote" },
  { key: "WFH", text: "WFH" },
];

export const Timesheet: React.FC<ITimesheetProps> = ({ employee }) => {
  const [projects, setProjects] = React.useState<IProject[]>([]);
  const [entries, setEntries] = React.useState<ITimesheet[]>([]);
  const [search, setSearch] = React.useState<string>("");
  const [message, setMessage] = React.useState<string | undefined>(undefined);

  const [projectId, setProjectId] = React.useState<number | undefined>(undefined);
  const [date, setDate] = React.useState<Date>(new Date());
  const [location, setLocation] = React.useState<TimesheetLocation>("Office");
  const [hours, setHours] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");

  const loadEntries = React.useCallback(() => {
    if (!employee) {
      return;
    }
    TimesheetService.getByEmployee(employee.Id)
      .then(setEntries)
      .catch((err) => {
        logError("Timesheet: load entries", err);
        setEntries([]);
      });
  }, [employee]);

  React.useEffect(() => {
    if (!employee) {
      return;
    }
    ProjectMemberService.getByEmployee(employee.Id)
      .then((memberships) => Promise.all(memberships.map((m) => ProjectService.getById(m.ProjectId))))
      .then(setProjects)
      .catch((err) => {
        logError("Timesheet: load projects", err);
        setProjects([]);
      });
    loadEntries();
  }, [employee, loadEntries]);

  const projectOptions: IDropdownOption[] = projects.map((p) => ({ key: p.Id, text: p.Title }));
  const projectTitle = (id: number): string => projects.find((p) => p.Id === id)?.Title ?? `#${id}`;

  const resetForm = (): void => {
    setProjectId(undefined);
    setDate(new Date());
    setLocation("Office");
    setHours("");
    setDescription("");
  };

  const submit = (): void => {
    if (!employee || !projectId || !hours) {
      setMessage("Project and hours are required.");
      return;
    }
    TimesheetService.add({
      EmployeeId: employee.Id,
      ProjectId: projectId,
      Date: date.toISOString().slice(0, 10),
      WorkLocation: location,
      HoursInvested: parseFloat(hours),
      Description: description,
      Status: "Submitted",
    } as Partial<ITimesheet>)
      .then(() => {
        setMessage("Timesheet submitted.");
        resetForm();
        loadEntries();
      })
      .catch((err) => {
        logError("Timesheet: submit", err);
        setMessage("Could not save the timesheet. Please try again.");
      });
  };

  const filtered = entries.filter((e) =>
    search ? projectTitle(e.ProjectId).toLowerCase().includes(search.toLowerCase()) : true,
  );

  const columns: IColumn[] = [
    { key: "date", name: "Date", fieldName: "Date", minWidth: 90, onRender: (item: ITimesheet) => new Date(item.Date).toLocaleDateString() },
    { key: "project", name: "Project", minWidth: 140, onRender: (item: ITimesheet) => projectTitle(item.ProjectId) },
    { key: "location", name: "Location", fieldName: "WorkLocation", minWidth: 80 },
    { key: "hours", name: "Hours", fieldName: "HoursInvested", minWidth: 60 },
    { key: "status", name: "Status", fieldName: "Status", minWidth: 90 },
    { key: "description", name: "Description", fieldName: "Description", minWidth: 200 },
  ];

  if (!employee) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.grid}>
      {message && (
        <MessageBar messageBarType={MessageBarType.info} onDismiss={() => setMessage(undefined)}>
          {message}
        </MessageBar>
      )}

      <div className={styles.row}>
        <SectionCard title="TimeSheet Form">
          <div className={styles.form}>
            <div className={styles.staticRow}>
              <span>Employee Id - {employee.EmployeeId}</span>
              <span>Name - {employee.Title}</span>
            </div>
            <Dropdown
              label="Project Title"
              options={projectOptions}
              selectedKey={projectId}
              onChange={(_, o) => setProjectId(o?.key as number)}
              placeholder="Select a project"
            />
            <Dropdown
              label="Location"
              options={LOCATION_OPTIONS}
              selectedKey={location}
              onChange={(_, o) => setLocation(o?.key as TimesheetLocation)}
            />
            <DatePicker label="Date" value={date} onSelectDate={(d) => d && setDate(d)} />
            <TextField label="Hours Invested" type="number" value={hours} onChange={(_, v) => setHours(v ?? "")} />
            <TextField label="Description" multiline rows={3} value={description} onChange={(_, v) => setDescription(v ?? "")} />
            <div className={styles.formActions}>
              <PrimaryButton text="Save" onClick={submit} />
              <DefaultButton text="Cancel" onClick={resetForm} />
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="TimeSheet Report"
          action={<TextField placeholder="Search..." value={search} onChange={(_, v) => setSearch(v ?? "")} />}
        >
          <DetailsList
            items={filtered}
            columns={columns}
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.none}
            compact
          />
          {filtered.length === 0 && <p>No timesheet entries yet.</p>}
        </SectionCard>
      </div>
    </div>
  );
};
