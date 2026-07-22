import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import UserPageHeader from "./childrens/UserPageHeader";
import UserTable from "./childrens/UserTable";
import UserStats from "./childrens/UserStats";

export default function ParentsUserComponent() {
  return (
    <div className="space-y-6">
      <UserPageHeader
        action={
          <Button asChild>
            <Link href="/dashboard/create-user">
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Link>
          </Button>
        }
      />
      <UserStats />
      <UserTable />
    </div>
  );
}
