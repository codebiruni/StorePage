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
      title="User Accounts Directory"
      subtitle="Authentication and login accounts for shoppers (Customers), branch staff (Team Members), and Administrators"
      badges={["Auth Accounts", "People"]}
      action={action}
    />
  );
}
