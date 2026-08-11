export type PaymentStatus = "Pending" | "Paid";

export interface IPayroll {
  Id: number;
  EmployeeId: number;
  PayPeriod: string;
  BasicSalary: number;
  Allowances?: number;
  Deductions?: number;
  NetPay: number;
  PayslipUrl?: string;
  PaymentStatus: PaymentStatus;
}
