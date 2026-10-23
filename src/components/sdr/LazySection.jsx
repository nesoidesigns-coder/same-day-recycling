import { Suspense } from "react";

// Renders a below-the-fold section after its chunk loads, with a fixed-height
// placeholder so late loading cannot shift the page layout (no CLS).
export default function LazySection({ minHeight = 320, children }) {
  return (
    <Suspense
      fallback={<div style={{ minHeight }} className="w-full bg-white" aria-hidden="true" />}
    >
      {children}
    </Suspense>
  );
}