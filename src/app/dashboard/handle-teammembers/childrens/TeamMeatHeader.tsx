import React from "react";
import WorkspaceHeader from "../../_shared/WorkspaceHeader";

interface TeamMeatHeaderProps {
  /** Right-side action slot — typically an Add link/button. */
  action?: React.ReactNode;
}

export default function TeamMeatHeader({
  action,
}: TeamMeatHeaderProps = {}) {
  return (
    <WorkspaceHeader
      title="Team Members Directory"
      subtitle="Internal store staff, managers, and branch employees with operational dashboard privileges"
      badges={["Staff", "People"]}
      action={action}
    />
  );
}
