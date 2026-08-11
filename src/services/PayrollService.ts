import { ListService } from "./ListService";
import { IPayroll } from "../models";

class PayrollServiceImpl extends ListService<IPayroll> {
  constructor() {
    super("Payroll", ["Id", "EmployeeId", "PayPeriod", "BasicSalary", "Allowances", "Deductions", "NetPay", "PayslipUrl", "PaymentStatus"]);
  }

  public async getByEmployee(employeeId: number): Promise<IPayroll[]> {
    return this.getAll(`EmployeeId eq ${employeeId}`, "PayPeriod", false);
  }
}

export const PayrollService = new PayrollServiceImpl();
