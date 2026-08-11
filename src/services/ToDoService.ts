import { ListService } from "./ListService";
import { IToDoTask } from "../models";

class ToDoServiceImpl extends ListService<IToDoTask> {
  constructor() {
    super("ToDoTasks", ["Id", "EmployeeId", "TaskText", "IsCompleted", "CreatedOn"]);
  }

  public async getByEmployee(employeeId: number): Promise<IToDoTask[]> {
    return this.getAll(`EmployeeId eq ${employeeId}`, "CreatedOn", false);
  }

  public async toggleComplete(id: number, isCompleted: boolean): Promise<void> {
    await this.update(id, { IsCompleted: isCompleted } as Partial<IToDoTask>);
  }
}

export const ToDoService = new ToDoServiceImpl();
