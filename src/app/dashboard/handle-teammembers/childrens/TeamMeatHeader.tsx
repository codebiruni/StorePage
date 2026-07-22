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
      title="Members Directory"
      subtitle="Manage staff members and their linked system accounts"
      badges={["Staff", "People"]}
      action={action}
    />
  );
}
