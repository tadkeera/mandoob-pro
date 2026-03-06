import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Home, ClipboardList, Database, Menu, X, PenTool, Users, LayoutDashboard, LogOut } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import companyLogo from "@/assets/company-logo.png";

interface NavItem {
  path: string;
  label: string;
  icon: any;
  hideForRoles?: string[];
}

const allNavItems: NavItem[] = [
  { path: "/", label: "الرئيسية", icon: Home },
  { path: "/manager-dashboard", label: "لوحة المدير", icon: LayoutDashboard, hideForRoles: ["representative"] },
  { path: "/doctor-support", label: "دعم طبيب", icon: FileText },
  { path: "/consignment", label: "تصريف", icon: FileText },
  { path: "/extra-bonus", label: "بونص إضافي", icon: FileText },
  { path: "/reports", label: "السجلات", icon: ClipboardList },
  { path: "/signature", label: "التوقيع", icon: PenTool },
  { path: "/data-management", label: "النسخ الاحتياطي", icon: Database, hideForRoles: ["representative"] },
  { path: "/user-management", label: "إدارة المستخدمين", icon: Users, hideForRoles: ["representative"] },
];

const Navbar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Branch manager only sees manager dashboard and signature
  const navItems = user?.role === 'branch-manager'
    ? [
        { path: "/manager-dashboard", label: "لوحة المدير", icon: LayoutDashboard },
        { path: "/signature", label: "التوقيع", icon: PenTool },
      ]
    : allNavItems.filter(item => {
        if (!user) return true;
        if (item.hideForRoles && item.hideForRoles.includes(user.role)) return false;
        if (item.path === "/manager-dashboard" && user.role !== "branch-manager" && user.role !== "admin") return false;
        return true;
      });

  return (
    <nav className="bg-primary shadow-lg sticky top-0 z-50 no-print">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 rounded-md bg-card flex items-center justify-center">
              <span className="text-primary font-bold text-lg">ب</span>
            </div>
            <span className="text-primary-foreground font-bold text-sm md:text-base hidden sm:block">
              مخازن بلقيس للأدوية
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-card text-primary"
                      : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {user && (
              <div className="flex items-center gap-2 mr-2 border-r border-primary-foreground/20 pr-2">
                <span className="text-primary-foreground/70 text-xs">{user.displayName}</span>
                <button onClick={logout} className="text-primary-foreground/60 hover:text-primary-foreground p-1" title="تسجيل الخروج">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <button
            className="md:hidden text-primary-foreground p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-card text-primary"
                      : "text-primary-foreground/80 hover:bg-primary-foreground/10"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            {user && (
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 w-full"
              >
                <LogOut className="h-5 w-5" />
                تسجيل الخروج ({user.displayName})
              </button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
