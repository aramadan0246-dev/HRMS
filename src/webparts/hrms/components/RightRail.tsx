import * as React from "react";
import { Icon } from "@fluentui/react/lib/Icon";
import { TextField } from "@fluentui/react/lib/TextField";
import { IconButton } from "@fluentui/react/lib/Button";
import { Checkbox } from "@fluentui/react/lib/Checkbox";
import { IEmployee } from "../../../models";
import { IToDoTask } from "../../../models";
import { IHoliday } from "../../../models";
import { ToDoService } from "../../../services/ToDoService";
import { HolidayService } from "../../../services/HolidayService";
import { EmployeeService } from "../../../services/EmployeeService";
import { logError } from "./shared/logError";
import styles from "./RightRail.module.scss";

export interface IRightRailProps {
  employee: IEmployee | undefined;
}

export const RightRail: React.FC<IRightRailProps> = ({ employee }) => {
  const [tasks, setTasks] = React.useState<IToDoTask[]>([]);
  const [newTask, setNewTask] = React.useState<string>("");
  const [holidays, setHolidays] = React.useState<IHoliday[]>([]);
  const [birthdays, setBirthdays] = React.useState<IEmployee[]>([]);

  const loadTasks = React.useCallback(() => {
    if (!employee) {
      return;
    }
    ToDoService.getByEmployee(employee.Id)
      .then(setTasks)
      .catch((err) => {
        logError("RightRail: load to-do tasks", err);
        setTasks([]);
      });
  }, [employee]);

  React.useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  React.useEffect(() => {
    HolidayService.getUpcoming(60)
      .then(setHolidays)
      .catch((err) => {
        logError("RightRail: load holidays", err);
        setHolidays([]);
      });
    EmployeeService.getUpcomingBirthdays(30)
      .then(setBirthdays)
      .catch((err) => {
        logError("RightRail: load birthdays", err);
        setBirthdays([]);
      });
  }, []);

  const addTask = (): void => {
    if (!employee || !newTask.trim()) {
      return;
    }
    ToDoService.add({ EmployeeId: employee.Id, TaskText: newTask.trim(), IsCompleted: false } as Partial<IToDoTask>)
      .then(() => {
        setNewTask("");
        loadTasks();
      })
      .catch((err) => logError("RightRail: add to-do task", err));
  };

  const toggleTask = (task: IToDoTask): void => {
    ToDoService.toggleComplete(task.Id, !task.IsCompleted)
      .then(loadTasks)
      .catch((err) => logError("RightRail: toggle to-do task", err));
  };

  const removeTask = (task: IToDoTask): void => {
    ToDoService.delete(task.Id)
      .then(loadTasks)
      .catch((err) => logError("RightRail: delete to-do task", err));
  };

  return (
    <aside className={styles.rail}>
      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <span>To do List</span>
          <Icon iconName="ClipboardList" />
        </header>
        <div className={styles.addRow}>
          <TextField
            placeholder="add some task...."
            value={newTask}
            onChange={(_, v) => setNewTask(v ?? "")}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <button type="button" className={styles.addButton} onClick={addTask}>
            Add
          </button>
        </div>
        <ul className={styles.taskList}>
          {tasks.map((t) => (
            <li key={t.Id} className={styles.taskRow}>
              <Checkbox checked={t.IsCompleted} onChange={() => toggleTask(t)} />
              <span className={t.IsCompleted ? styles.taskTextDone : styles.taskText}>{t.TaskText}</span>
              <IconButton iconProps={{ iconName: "Delete" }} onClick={() => removeTask(t)} ariaLabel="Delete task" />
            </li>
          ))}
          {tasks.length === 0 && <li className={styles.emptyRow}>No tasks yet.</li>}
        </ul>
      </section>

      <section className={styles.card}>
        <header className={styles.cardHeader}>
          <span>NOTIFICATION</span>
          <Icon iconName="Ringer" />
        </header>
        <div className={styles.notifyGroup}>
          <div className={styles.notifyLabel}>Upcoming Holidays</div>
          {holidays.length === 0 && <div className={styles.emptyRow}>None in the next 60 days.</div>}
          {holidays.slice(0, 3).map((h) => (
            <div key={h.Id} className={styles.notifyRow}>
              <span>{h.HolidayName}</span>
              <span className={styles.notifyDate}>{new Date(h.Date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
        <div className={styles.notifyGroup}>
          <div className={styles.notifyLabel}>Upcoming Birthdays</div>
          {birthdays.length === 0 && <div className={styles.emptyRow}>None in the next 30 days.</div>}
          {birthdays.slice(0, 3).map((b) => (
            <div key={b.Id} className={styles.notifyRow}>
              <span>{b.Title}</span>
              <span className={styles.notifyDate}>
                {b.DateOfBirth && new Date(b.DateOfBirth).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
};
