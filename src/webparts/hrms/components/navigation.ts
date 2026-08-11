export type NavKey =
  | "dashboard"
  | "myproject"
  | "attendance"
  | "leave"
  | "timesheet"
  | "payroll"
  | "hrpolicy"
  | "profile"
  | "reportanalysis";

export interface INavItem {
  key: NavKey;
  label: string;
  iconName: string;
}

export const NAV_ITEMS: INavItem[] = [
  { key: "dashboard", label: "Dashboard", iconName: "ViewDashboard" },
  { key: "myproject", label: "My Project", iconName: "ProjectCollection" },
  { key: "attendance", label: "Attendance", iconName: "Clock" },
  { key: "leave", label: "Leave Module", iconName: "EventDate" },
  { key: "timesheet", label: "Timesheet", iconName: "TimeSheet" },
  { key: "payroll", label: "My Payroll", iconName: "Money" },
  { key: "hrpolicy", label: "HR Policy", iconName: "TextDocument" },
  { key: "profile", label: "My Profile", iconName: "Contact" },
  { key: "reportanalysis", label: "Report & Analysis", iconName: "ReportDocument" },
];
