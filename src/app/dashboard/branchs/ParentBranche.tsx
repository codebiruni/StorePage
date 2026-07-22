import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import AllBranch from "./childern/AllBranch";
import WorkspaceHeader from "../_shared/WorkspaceHeader";

export default function ParentBranche() {
  return (
    <div className="space-y-4 mt-2">
      <WorkspaceHeader
        title="All Branchs"
        subtitle="All registered system branch"
        action={
          <Link href="/dashboard/create-branch">
            <Button>Add Branch</Button>
          </Link>
        }
      />

      {/* Main Content */}
      <AllBranch />
    </div>
  );
}
