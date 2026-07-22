"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import AddSubCategoryForm from "./children/AddSubCategoryForm";
import SubCategoryTable from "./children/SubCategoryTable";
import WorkspaceHeader from "../_shared/WorkspaceHeader";

export default function ParentsSubCategory() {
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);

  return (
    <div className="pt-4">
      <WorkspaceHeader
        title="All Sub Category"
        subtitle="All registered system sub category"
        className="my-4"
        action={
          <Dialog open={isSubDialogOpen} onOpenChange={setIsSubDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Sub Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] ">
              <DialogHeader>
                <DialogTitle>Create New Sub Category</DialogTitle>
              </DialogHeader>
              <AddSubCategoryForm />
            </DialogContent>
          </Dialog>
        }
      />

      <SubCategoryTable />
    </div>
  );
}
