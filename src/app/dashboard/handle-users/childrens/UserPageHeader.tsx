import React from "react";
import WorkspaceHeader from "../../_shared/WorkspaceHeader";

interface UserPageHeaderProps {
  /** Right-side action slot — typically an Add link/button. */
  action?: React.ReactNode;
}

export default function UserPageHeader({
  action,
}: UserPageHeaderProps = {}) {
  return (
    <WorkspaceHeader
      title="User Directory"
      subtitle="Manage system users, roles, and access permissions"
      badges={["Access", "People"]}
      action={action}
    />
  );
}
