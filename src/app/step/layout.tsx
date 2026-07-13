// Note: this is a NESTED layout only. Next.js App Router requires exactly one
// ROOT layout (src/app/layout.tsx) which owns <html>/<body>. A nested layout
// can NOT remove parent chrome (navbar/footer).
//
// The actual navbar/footer suppression for the public landing funnel is done
// inside ParentNav and ParentFooter — they each check usePathname() and render
// null when the path starts with "/step". That is the supported pattern.
import "../step/landing.css";

export const dynamic = "force-static";
export const revalidate = 3600;

export default function StepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="step-landing-body">{children}</div>;
}