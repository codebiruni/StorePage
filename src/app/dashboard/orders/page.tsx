import React from "react";
import AllOrderData from "./AllOrderData";
import WorkspaceHeader from "../_shared/WorkspaceHeader";

export default function page() {
  return (
    <div className="min-w-0">
      <WorkspaceHeader
        title="Order Directory"
        subtitle="All registered system orders"
      />
      <AllOrderData />
    </div>
  );
}
