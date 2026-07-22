"use client";
import React, { useState } from "react";
import CategoryTable from "./children/CategoryTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import AddCategoryForm from "./children/AddCategoryForm";
import WorkspaceHeader from "../_shared/WorkspaceHeader";

export default function ParentCategory() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-4 mt-5">
      {/* Header Section */}
      <WorkspaceHeader
        title="All Category"
        subtitle="All registered system category"
        action={
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] ">
              <DialogHeader>
                <DialogTitle>Create New Category</DialogTitle>
              </DialogHeader>
              <AddCategoryForm />
            </DialogContent>
          </Dialog>
        }
      />

      {/* Category Table */}
      <div>
        <CategoryTable />
      </div>
    </div>
  );
}
