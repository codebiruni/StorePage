import React, { Suspense } from "react";
import EditInfo from "./EditInfo";

export default function page() {
  return (
    <Suspense fallback={null}>
      <EditInfo />
    </Suspense>
  );
}
