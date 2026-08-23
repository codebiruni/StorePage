import React from "react";
import DraftsList from "./DraftsList";
import WorkspaceHeader from "../../_shared/WorkspaceHeader";

export const metadata = {
  title: "Draft & Abandoned Orders | Dashboard",
};

export default function DraftsPage() {
  return (
    <div className="overflow-x-auto">
      <WorkspaceHeader
        title="Uncompleted Orders"
        subtitle="Incomplete checkouts and abandoned carts — recoverable leads"
      />
      <DraftsList />
    </div>
  );
}