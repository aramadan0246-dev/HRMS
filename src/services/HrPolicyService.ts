import { ListService } from "./ListService";
import { IHrPolicy } from "../models";

class HrPolicyServiceImpl extends ListService<IHrPolicy> {
  constructor() {
    super("HRPolicies", ["Id", "PolicyName", "Category", "DocumentUrl", "EffectiveDate", "Versions"]);
  }
}

export const HrPolicyService = new HrPolicyServiceImpl();
