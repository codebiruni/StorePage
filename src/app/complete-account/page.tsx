import React, { Suspense } from "react";
import CompleteProfile from "./CompleteProfile";
import { Loader2 } from "lucide-react";

export default function CompleteAccountPage() {
  return (
    <div className="top-padding min-h-screen bg-background">
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <CompleteProfile />
      </Suspense>
    </div>
  );
}
