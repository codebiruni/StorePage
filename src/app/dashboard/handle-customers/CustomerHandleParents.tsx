import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import AllCustomersTable from "./childrens/AllCustomersTable";
import CustomerStats from "./childrens/CustomerStats";
import WorkspaceHeader from "../_shared/WorkspaceHeader";

export default function CustomerHandleParents() {
  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Customers Directory"
        subtitle="Manage customer profiles, contact details and account status"
        badges={["CRM", "People"]}
        action={
          <Button asChild>
            <Link href="/dashboard/create-customer">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Customer
            </Link>
          </Button>
        }
      />
      <CustomerStats />
      <AllCustomersTable />
    </div>
  );
}
