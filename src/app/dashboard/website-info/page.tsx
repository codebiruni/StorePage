import React, { Suspense } from "react";
import Info from "./Info";

export default function page() {
  return (
    <Suspense fallback={null}>
      <Info />
    </Suspense>
  );
}
