import * as React from "react";
import { DatePicker } from "@fluentui/react/lib/DatePicker";
import { Dropdown, IDropdownOption } from "@fluentui/react/lib/Dropdown";
import styles from "./ReportAnalysis.module.scss";

export interface IReportFilters {
  fromDate: Date;
  toDate: Date;
  department?: string;
}

export interface IReportFilterBarProps {
  filters: IReportFilters;
  onChange: (filters: IReportFilters) => void;
  departments?: string[];
}

export const ReportFilterBar: React.FC<IReportFilterBarProps> = ({ filters, onChange, departments }) => {
  const departmentOptions: IDropdownOption[] = [
    { key: "", text: "All Departments" },
    ...(departments ?? []).map((d) => ({ key: d, text: d })),
  ];

  return (
    <div className={styles.filterBar}>
      <DatePicker
        label="From"
        value={filters.fromDate}
        onSelectDate={(d) => d && onChange({ ...filters, fromDate: d })}
      />
      <DatePicker
        label="To"
        value={filters.toDate}
        onSelectDate={(d) => d && onChange({ ...filters, toDate: d })}
      />
      {departments && (
        <Dropdown
          label="Department"
          options={departmentOptions}
          selectedKey={filters.department ?? ""}
          onChange={(_, o) => onChange({ ...filters, department: (o?.key as string) || undefined })}
        />
      )}
    </div>
  );
};
