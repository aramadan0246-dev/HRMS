import * as React from "react";
import { Spinner, SpinnerSize } from "@fluentui/react/lib/Spinner";
import { MessageBar, MessageBarType } from "@fluentui/react/lib/MessageBar";
import { WebPartContext } from "@microsoft/sp-webpart-base";

import { Sidebar } from "./Sidebar";
import { RightRail } from "./RightRail";
import { NavKey } from "./navigation";
import { IEmployee } from "../../../models";
import { EmployeeService } from "../../../services/EmployeeService";
import { useLocalStorageState } from "./shared/useLocalStorageState";
import { logError } from "./shared/logError";

import { Dashboard } from "./modules/Dashboard/Dashboard";
import { Timesheet } from "./modules/Timesheet/Timesheet";
import { Leave } from "./modules/Leave/Leave";
import { MyProject } from "./modules/MyProject/MyProject";
import { Attendance } from "./modules/Attendance/Attendance";
import { Payroll } from "./modules/Payroll/Payroll";
import { HrPolicy } from "./modules/HrPolicy/HrPolicy";
import { MyProfile } from "./modules/MyProfile/MyProfile";
import { ReportAnalysis } from "./modules/ReportAnalysis/ReportAnalysis";

import styles from "./AppShell.module.scss";

export interface IAppShellProps {
  context: WebPartContext;
  isDarkTheme: boolean;
  userDisplayName: string;
}

type ThemeChoice = "auto" | "light" | "dark";

export const AppShell: React.FC<IAppShellProps> = ({ context, isDarkTheme, userDisplayName }) => {
  const [selected, setSelected] = React.useState<NavKey>("dashboard");
  const [employee, setEmployee] = React.useState<IEmployee | undefined>(undefined);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [collapsed, setCollapsed] = useLocalStorageState<boolean>("hrms.sidebarCollapsed", false);
  const [themeChoice, setThemeChoice] = useLocalStorageState<ThemeChoice>("hrms.theme", "auto");

  const effectiveDark = themeChoice === "auto" ? isDarkTheme : themeChoice === "dark";

  const photoUrl = `${context.pageContext.web.absoluteUrl}/_layouts/15/userphoto.aspx?size=L&accountname=${encodeURIComponent(
    context.pageContext.user.email || context.pageContext.user.loginName,
  )}`;

  React.useEffect(() => {
    EmployeeService.getCurrentEmployee(context.pageContext.user.email)
      .then((emp) => {
        setEmployee(emp);
        setLoading(false);
      })
      .catch((err) => {
        logError("AppShell: resolve current employee", err);
        setError(
          "Could not find your record in the Employees list. Some modules will be limited until an HR admin adds you.",
        );
        setLoading(false);
      });
  }, []);

  const renderModule = (): React.ReactElement => {
    switch (selected) {
      case "dashboard":
        return <Dashboard employee={employee} />;
      case "myproject":
        return <MyProject employee={employee} />;
      case "attendance":
        return <Attendance employee={employee} />;
      case "leave":
        return <Leave employee={employee} />;
      case "timesheet":
        return <Timesheet employee={employee} />;
      case "payroll":
        return <Payroll employee={employee} />;
      case "hrpolicy":
        return <HrPolicy />;
      case "profile":
        return <MyProfile employee={employee} photoUrl={photoUrl} />;
      case "reportanalysis":
        return <ReportAnalysis employee={employee} />;
      default:
        return <Dashboard employee={employee} />;
    }
  };

  return (
    <div className={`${styles.shell} ${effectiveDark ? styles.dark : ""}`}>
      <Sidebar
        employee={employee}
        userDisplayName={userDisplayName}
        photoUrl={photoUrl}
        selected={selected}
        onSelect={setSelected}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(!collapsed)}
        isDarkTheme={effectiveDark}
        onToggleTheme={() => setThemeChoice(effectiveDark ? "light" : "dark")}
      />

      <main className={styles.content}>
        {error && (
          <MessageBar messageBarType={MessageBarType.warning} isMultiline={false} className={styles.notice}>
            {error}
          </MessageBar>
        )}
        {loading ? (
          <div className={styles.loadingRow}>
            <Spinner size={SpinnerSize.medium} label="Loading your workspace..." />
          </div>
        ) : (
          renderModule()
        )}
      </main>

      <RightRail employee={employee} />
    </div>
  );
};
