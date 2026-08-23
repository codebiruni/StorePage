import {
  BarChart3,
  Boxes,
  Calculator,
  CalendarDays,
  ClipboardList,
  FolderPlus,
  Home,
  ListChecks,
  Package,
  PackagePlus,
  PieChart,
  Search,
  Settings,
  Settings2,
  ShoppingBag,
  StickyNote,
  Tags,
  Truck,
  Users,
  UserPlus,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavSubItem = {
  title: string;
  url: string;
};

export type NavGroup = {
  title: string;
  icon: LucideIcon;
  isActive?: boolean;
  items?: NavSubItem[];
};

export type QuickLink = {
  name: string;
  url: string;
  icon: LucideIcon;
};

export const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Elham Books",
      logo: Package,
      plan: "Storefront",
    },
  ],
  navMain: [
    {
      title: "Catalog",
      icon: Boxes,
      items: [
        { title: "Products", url: "/dashboard/products" },
        { title: "Categories", url: "/dashboard/categories" },
        { title: "Sub Categories", url: "/dashboard/sub-categories" },
      ],
    },
    {
      title: "Inventory",
      icon: Package,
      items: [
        { title: "Branches", url: "/dashboard/branchs" },
        { title: "Stock Report", url: "/dashboard/product-report" },
      ],
    },
    {
      title: "Sales",
      icon: ShoppingBag,
      items: [
        { title: "All Orders", url: "/dashboard/orders" },
        { title: "Drafts & Abandoned", url: "/dashboard/orders/drafts" },
        { title: "Order Analysis", url: "/dashboard/order-analysis" },
        { title: "Steadfast Courier", url: "/dashboard/steadfast" },
      ],
    },
    {
      title: "People",
      icon: Users,
      items: [
        { title: "Customers", url: "/dashboard/handle-customers" },
        { title: "Users", url: "/dashboard/handle-users" },
        { title: "Team Members", url: "/dashboard/handle-teammembers" },
      ],
    },
    {
      title: "Site",
      icon: Settings2,
      items: [
        { title: "Website Info", url: "/dashboard/website-info" },
        { title: "Site Settings", url: "/dashboard/website-info/settings" },
      ],
    },
    {
      title: "Tools",
      icon: ListChecks,
      items: [
        { title: "Customer Checker", url: "/dashboard/customer-checker" },
        { title: "Calculator", url: "/dashboard/calculator" },
        { title: "Calendar", url: "/dashboard/calendar" },
        { title: "Personal Note", url: "/dashboard/personal-note" },
      ],
    },
    {
      title: "Account",
      icon: Settings,
      items: [
        { title: "Change Password", url: "/dashboard/settings" },
        { title: "Courier API", url: "/dashboard/account/courier-api" },
      ],
    },
  ],
  quickLinks: [
    { name: "Dashboard", url: "/dashboard", icon: BarChart3 },
    { name: "Add Product", url: "/dashboard/create-product", icon: PackagePlus },
    { name: "Add Customer", url: "/dashboard/create-customer", icon: UserPlus },
    { name: "Add Branch", url: "/dashboard/create-branch", icon: FolderPlus },
    { name: "Add Team Member", url: "/dashboard/create-member", icon: Users },
    { name: "Add User", url: "/dashboard/create-user", icon: UserPlus },
    { name: "Edit Site Info", url: "/dashboard/create-site-info", icon: Tags },
    { name: "Customer Lookup", url: "/dashboard/customer-checker", icon: Search },
    { name: "Stock Report", url: "/dashboard/product-report", icon: PieChart },
    { name: "Pending Orders", url: "/dashboard/orders", icon: ClipboardList },
    { name: "Site Settings", url: "/dashboard/website-info/settings", icon: Truck },
    { name: "Cash & Payments", url: "/dashboard/orders", icon: Wallet },
    { name: "Calculator", url: "/dashboard/calculator", icon: Calculator },
    { name: "Calendar", url: "/dashboard/calendar", icon: CalendarDays },
    { name: "Personal Note", url: "/dashboard/personal-note", icon: StickyNote },
    { name: "Storefront", url: "/", icon: Home },
  ] satisfies QuickLink[],
};
