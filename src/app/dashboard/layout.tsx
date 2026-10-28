import { AppSidebar } from "@/components/app-sidebar";
import DashboardHeader from "@/components/dashboard-header";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider className="w-full fixed h-screen z-[501]">
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <DashboardHeader />
        <div className="flex min-w-0 mt-12 flex-1 flex-col gap-4 p-3.5 sm:p-5 pt-3 pb-24 overflow-y-auto overflow-x-hidden h-[calc(100vh-3rem)]">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
