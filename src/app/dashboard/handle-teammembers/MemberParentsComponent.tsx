import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import TeamMeatHeader from "./childrens/TeamMeatHeader";
import MembersTable from "./childrens/MembersTable";
import MemberStats from "./childrens/MemberStats";

export default function MemberParentsComponent() {
  return (
    <div className="space-y-6">
      <TeamMeatHeader
        action={
          <Button asChild>
            <Link href="/dashboard/create-member">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Link>
          </Button>
        }
      />
      <MemberStats />
      <MembersTable />
    </div>
  );
}
