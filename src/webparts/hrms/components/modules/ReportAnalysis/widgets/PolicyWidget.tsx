import * as React from "react";
import { DetailsList, DetailsListLayoutMode, IColumn, SelectionMode } from "@fluentui/react/lib/DetailsList";
import { HrPolicyService } from "../../../../../../services/HrPolicyService";
import { IHrPolicy } from "../../../../../../models";
import { SectionCard } from "../../../shared/SectionCard";
import { ExportButtons } from "../../../shared/ExportButtons";
import { exportRowsToCsv } from "../../../shared/exportCsv";
import { exportTableToPdf } from "../../../shared/exportPdf";
import { logError } from "../../../shared/logError";

interface ICategoryCount {
  category: string;
  count: number;
}

const columns: IColumn[] = [
  { key: "category", name: "Category", fieldName: "category", minWidth: 160 },
  { key: "count", name: "Policies", fieldName: "count", minWidth: 90 },
];

export const PolicyWidget: React.FC = () => {
  const [policies, setPolicies] = React.useState<IHrPolicy[]>([]);

  React.useEffect(() => {
    HrPolicyService.getAll()
      .then(setPolicies)
      .catch((err) => {
        logError("PolicyWidget: load", err);
        setPolicies([]);
      });
  }, []);

  const byCategory: ICategoryCount[] = React.useMemo(() => {
    const counts: Record<string, number> = {};
    policies.forEach((p) => {
      const category = p.Category || "Uncategorized";
      counts[category] = (counts[category] ?? 0) + 1;
    });
    return Object.keys(counts)
      .sort()
      .map((category) => ({ category, count: counts[category] }));
  }, [policies]);

  return (
    <SectionCard
      title="HR Policies by Category"
      action={
        <ExportButtons
          onExportCsv={() => exportRowsToCsv("policies-by-category", byCategory.map((c) => ({ Category: c.category, Count: c.count })))}
          onExportPdf={() =>
            exportTableToPdf(
              "policies-by-category",
              "HR Policies by Category",
              ["Category", "Policies"],
              byCategory.map((c) => [c.category, c.count]),
            )
          }
        />
      }
    >
      <DetailsList
        items={byCategory}
        columns={columns}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
        compact
      />
      {byCategory.length === 0 && <p>No HR policies published yet.</p>}
    </SectionCard>
  );
};
