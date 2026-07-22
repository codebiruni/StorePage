import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ProductsTable from "./children/ProductsTable";
import WorkspaceHeader from "../_shared/WorkspaceHeader";

export default function ProductParent() {
  return (
    <div>
      <WorkspaceHeader
        title="Product Directory"
        subtitle="All registered system products"
        action={
          <Link href="/dashboard/create-product">
            <Button>Add Product</Button>
          </Link>
        }
      />
      <ProductsTable />
    </div>
  );
}
