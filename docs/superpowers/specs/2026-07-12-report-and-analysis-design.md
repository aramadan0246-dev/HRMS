# Report & Analysis Dashboard — Design

Date: 2026-07-12

## Purpose

Add a new "Report & Analysis" page to the HRMS SPFx web part: a modern, Power-BI-style
dashboard with KPI tiles and charts, with CSV and PDF export on every widget and on the
full report. All data is sourced from existing SharePoint lists (Employees, Attendance,
LeaveRequests, LeaveBalances, Timesheets, Payroll, Projects, HrPolicies) — no new lists
or service methods are required beyond the already-public `ListService.getAll(filter, orderBy)`.

## Access & scoping

The page adapts its widget set to `employee.SystemRole`, mirroring the existing gating
pattern in `Payroll.tsx` (`employee.SystemRole === "Payroll Admin"` renders `PayrollAdminPanel`)
and `Leave.tsx` (`SystemRole === "Manager" || "HR Admin"` renders the approvals table).

| Role | Sees |
|---|---|
| Employee | Personal Attendance / Leave / Timesheet widgets only (`EmployeeId eq {id}` filters). |
| Manager | Personal widgets, plus a "My Team" section scoped to direct reports (`ManagerId eq {id}`) covering Attendance / Leave / Timesheet / Projects. No Payroll. |
| HR Admin | Personal widgets, org-wide (unfiltered) Attendance / Leave / Timesheet / Projects, plus Headcount/Directory and HR Policy widgets. No Payroll. |
| Payroll Admin | Personal widgets, plus org-wide Payroll cost widgets. |

Payroll visibility stays restricted to Payroll Admin only, consistent with how the existing
Payroll module already withholds payslip data from Managers and HR Admin.

## Filter bar

A `ReportFilterBar` component provides:
- Date range picker, defaulting to the current month.
- Department dropdown (HR Admin only), populated from distinct `Employee.Department` values.

Filter state is lifted into `ReportAnalysis.tsx` and threaded into every widget's data query
and into both export paths, so exports always reflect what's on screen.

## Widgets

Built on `@fluentui/react-charting` (Microsoft's Fluent-themed charting library — chosen so
charts automatically match the app's existing Fluent UI theme/colors without manual theme
wiring, giving the closest in-app visual match to Power BI).

| Domain | Chart | KPI tiles | Roles |
|---|---|---|---|
| Attendance | VerticalBarChart (Present/Absent/WFH per day) | Attendance rate % | All |
| Leave | DonutChart (taken by type) | Balance vs entitlement | All |
| Timesheet | LineChart (hours over time) | Total hours / utilization | All |
| Payroll | VerticalBarChart (net pay cost trend, by pay period) | Total payroll cost | Payroll Admin |
| Headcount/Directory | HorizontalBarChart (by department/role/work location) | Active/inactive counts | HR Admin |
| Projects | DonutChart (status breakdown) | — | Manager, HR Admin |
| HR Policy | Table | Policy count by category | HR Admin |

Each widget fetches and aggregates its own domain's data client-side (SharePoint REST has no
native aggregation), scoped by the current role/filter state, and renders both its KPI tile(s)
and its chart from that one aggregation pass.

## Export

Two new shared utilities:
- `shared/exportCsv.ts` — converts an array of row objects to a CSV string and triggers a
  browser download via a `Blob`. No external library.
- `shared/exportPdf.ts` — `jspdf` + `jspdf-autotable` for per-widget tabular PDF export;
  `html2canvas` + `jspdf` for a single "Export Full Report (PDF)" button that snapshots the
  entire dashboard (as currently filtered) into a multi-page PDF.

Every widget's `SectionCard` header gets small "Export CSV" / "Export PDF" buttons. One
prominent button at the top of the page exports the full report.

## New dependencies

`@fluentui/react-charting`, `jspdf`, `jspdf-autotable`, `html2canvas` — all installed via npm
and bundled by webpack like existing dependencies. No CDN or externally-loaded scripts, so the
SPFx CSP configuration is unaffected.

## File structure

```
src/webparts/hrms/components/modules/ReportAnalysis/
  ReportAnalysis.tsx
  ReportFilterBar.tsx
  ReportAnalysis.module.scss
  widgets/
    AttendanceWidget.tsx
    LeaveWidget.tsx
    TimesheetWidget.tsx
    PayrollWidget.tsx      (Payroll Admin only)
    HeadcountWidget.tsx    (HR Admin only)
    ProjectsWidget.tsx     (Manager/HR Admin)
    PolicyWidget.tsx       (HR Admin only)
src/webparts/hrms/components/shared/exportCsv.ts
src/webparts/hrms/components/shared/exportPdf.ts
```

Plus:
- One new `NavKey` (`"reportanalysis"`) and `NAV_ITEMS` entry in `navigation.ts`.
- One new `case "reportanalysis":` in `AppShell.tsx`'s `renderModule()`, passing `employee`
  and `context` (the latter needed for department lookups against `EmployeeService`).

## Out of scope

- No new SharePoint lists or columns.
- No server-side/Power BI Embedded integration — charts are rendered client-side only.
- No acknowledgment tracking for HR Policies (not supported by the current `HrPolicy` list
  schema); the Policy widget is limited to a category count.
