import { WebPartContext } from "@microsoft/sp-webpart-base";

export interface IHrmsProps {
  context: WebPartContext;
  isDarkTheme: boolean;
  userDisplayName: string;
}
