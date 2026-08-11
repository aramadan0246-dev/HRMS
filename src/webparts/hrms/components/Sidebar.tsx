import * as React from "react";
import { Persona, PersonaSize } from "@fluentui/react/lib/Persona";
import { Icon } from "@fluentui/react/lib/Icon";
import { TooltipHost } from "@fluentui/react/lib/Tooltip";
import { NAV_ITEMS, NavKey } from "./navigation";
import { IEmployee } from "../../../models";
import styles from "./Sidebar.module.scss";

export interface ISidebarProps {
  employee: IEmployee | undefined;
  userDisplayName: string;
  photoUrl?: string;
  selected: NavKey;
  onSelect: (key: NavKey) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isDarkTheme: boolean;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<ISidebarProps> = ({
  employee,
  userDisplayName,
  photoUrl,
  selected,
  onSelect,
  collapsed,
  onToggleCollapsed,
  isDarkTheme,
  onToggleTheme,
}) => {
  const onLogout = (): void => {
    window.location.href = "/_layouts/15/SignOut.aspx";
  };

  const displayName = employee?.Title ?? userDisplayName;

  return (
    <nav className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""}`}>
      <button
        type="button"
        className={styles.collapseToggle}
        onClick={onToggleCollapsed}
        aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
        title={collapsed ? "Expand navigation" : "Collapse navigation"}
      >
        <Icon iconName={collapsed ? "DoubleChevronRight12" : "DoubleChevronLeft12"} />
      </button>

      <div className={styles.profile}>
        <Persona
          text={displayName}
          imageUrl={photoUrl}
          size={collapsed ? PersonaSize.size32 : PersonaSize.size56}
          hidePersonaDetails
        />
        {!collapsed && (
          <>
            <div className={styles.profileName}>{displayName}</div>
            <div className={styles.profileRole}>{employee?.Designation ?? employee?.SystemRole ?? ""}</div>
          </>
        )}
      </div>

      <ul className={styles.navList}>
        {NAV_ITEMS.map((item) => {
          const button = (
            <button
              type="button"
              className={item.key === selected ? styles.navItemActive : styles.navItem}
              onClick={() => onSelect(item.key)}
            >
              <Icon iconName={item.iconName} className={styles.navIcon} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
          return (
            <li key={item.key}>
              {collapsed ? (
                <TooltipHost content={item.label}>{button}</TooltipHost>
              ) : (
                button
              )}
            </li>
          );
        })}
      </ul>

      <div className={styles.footer}>
        <TooltipHost content={isDarkTheme ? "Switch to light mode" : "Switch to dark mode"}>
          <button type="button" className={styles.navItem} onClick={onToggleTheme}>
            <Icon iconName={isDarkTheme ? "Sunny" : "ClearNight"} className={styles.navIcon} />
            {!collapsed && <span>{isDarkTheme ? "Light mode" : "Dark mode"}</span>}
          </button>
        </TooltipHost>

        <TooltipHost content="Logout">
          <button type="button" className={styles.navItem} onClick={onLogout}>
            <Icon iconName="SignOut" className={styles.navIcon} />
            {!collapsed && <span>Logout</span>}
          </button>
        </TooltipHost>
      </div>
    </nav>
  );
};
