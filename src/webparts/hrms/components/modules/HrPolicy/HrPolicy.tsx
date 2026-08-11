import * as React from "react";
import { DetailsList, DetailsListLayoutMode, IColumn, SelectionMode } from "@fluentui/react/lib/DetailsList";
import { Link } from "@fluentui/react/lib/Link";
import { IHrPolicy } from "../../../../../models";
import { HrPolicyService } from "../../../../../services/HrPolicyService";
import { SectionCard } from "../../shared/SectionCard";
import { logError } from "../../shared/logError";

export const HrPolicy: React.FC = () => {
  const [policies, setPolicies] = React.useState<IHrPolicy[]>([]);

  React.useEffect(() => {
    HrPolicyService.getAll()
      .then(setPolicies)
      .catch((err) => {
        logError("HrPolicy: load policies", err);
        setPolicies([]);
      });
  }, []);

  const columns: IColumn[] = [
    { key: "name", name: "Policy", minWidth: 180, onRender: (p: IHrPolicy) => <Link href={p.DocumentUrl} target="_blank">{p.PolicyName}</Link> },
    { key: "category", name: "Category", fieldName: "Category", minWidth: 120 },
    {
      key: "effective",
      name: "Effective Date",
      minWidth: 110,
      onRender: (p: IHrPolicy) => (p.EffectiveDate ? new Date(p.EffectiveDate).toLocaleDateString() : "—"),
    },
    { key: "version", name: "Version", fieldName: "Versions", minWidth: 70 },
  ];

  return (
    <SectionCard title="HR Policies">
      <DetailsList
        items={policies}
        columns={columns}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
        compact
      />
      {policies.length === 0 && <p>No policies published yet.</p>}
    </SectionCard>
  );
};
