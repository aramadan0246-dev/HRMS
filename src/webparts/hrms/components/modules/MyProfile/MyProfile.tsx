import * as React from "react";
import { Persona, PersonaSize } from "@fluentui/react/lib/Persona";
import { IEmployee } from "../../../../../models";
import { SectionCard } from "../../shared/SectionCard";
import styles from "./MyProfile.module.scss";

export interface IMyProfileProps {
  employee: IEmployee | undefined;
  photoUrl?: string;
}

const Field: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div className={styles.field}>
    <span className={styles.fieldLabel}>{label}</span>
    <span className={styles.fieldValue}>{value || "—"}</span>
  </div>
);

export const MyProfile: React.FC<IMyProfileProps> = ({ employee, photoUrl }) => {
  if (!employee) {
    return <p>Loading...</p>;
  }

  return (
    <SectionCard title="My Profile">
      <div className={styles.header}>
        <Persona text={employee.Title} imageUrl={photoUrl} size={PersonaSize.size72} hidePersonaDetails />
        <div>
          <h3 className={styles.name}>{employee.Title}</h3>
          <p className={styles.designation}>{employee.Designation}</p>
        </div>
      </div>
      <div className={styles.fields}>
        <Field label="Employee Id" value={employee.EmployeeId} />
        <Field label="Email" value={employee.Email} />
        <Field label="Department" value={employee.Department} />
        <Field label="Work Location" value={employee.WorkLocation} />
        <Field label="Employment Status" value={employee.EmploymentStatus} />
        <Field label="Role" value={employee.SystemRole} />
        <Field label="Date of Joining" value={employee.DateOfJoining && new Date(employee.DateOfJoining).toLocaleDateString()} />
        <Field label="Date of Birth" value={employee.DateOfBirth && new Date(employee.DateOfBirth).toLocaleDateString()} />
      </div>
    </SectionCard>
  );
};
