import * as React from "react";
import type { IHrmsProps } from "./IHrmsProps";
import { AppShell } from "./AppShell";

export default class Hrms extends React.Component<IHrmsProps> {
  public render(): React.ReactElement<IHrmsProps> {
    const { context, isDarkTheme, userDisplayName } = this.props;
    return <AppShell context={context} isDarkTheme={isDarkTheme} userDisplayName={userDisplayName} />;
  }
}
