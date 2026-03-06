import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { FileText, ClipboardList, Database, PenTool, Users, LayoutDashboard } from "lucide-react";

const Index = () => {
  const { user } = useAuth();

  const formCards = [
    {
      title: "استمارة دعم طبيب",
      description: "نموذج طلب دعم مالي لطبيب مع تفاصيل التخصص والصيدليات",
      path: "/doctor-support",
      icon: FileText,
    },
    {
      title: "نموذج تصريف",
      description: "إنشاء نموذج لتصريف الأصناف",
      path: "/consignment",
      icon: FileText,
    },
    {
      title: "استمارة بونص إضافي",
      description: "نموذج طلب بونص إضافي للعملاء",
      path: "/extra-bonus",
      icon: FileText,
    },
    {
      title: "السجلات",
      description: "عرض وإدارة جميع النماذج المحفوظة",
      path: "/reports",
      icon: ClipboardList,
    },
    {
      title: "إدارة التوقيع",
      description: "رفع وحفظ صورة التوقيع لإضافتها للنماذج",
      path: "/signature",
      icon: PenTool,
    },
  ];

  // Add role-specific cards
  if (user && user.role !== "representative") {
    formCards.push(
      {
        title: "النسخ الاحتياطي",
        description: "إدارة البيانات والنسخ الاحتياطي",
        path: "/data-management",
        icon: Database,
      },
      {
        title: "إدارة المستخدمين",
        description: "إضافة وإدارة حسابات المستخدمين",
        path: "/user-management",
        icon: Users,
      }
    );
  }

  if (user && (user.role === "branch-manager" || user.role === "admin")) {
    formCards.unshift({
      title: "لوحة تحكم مدير الفرع",
      description: "عرض ومتابعة نماذج المندوبين والاعتماد",
      path: "/manager-dashboard",
      icon: LayoutDashboard,
    });
  }

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="bg-primary py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="h-24 w-24 mx-auto mb-6 rounded-xl bg-card flex items-center justify-center shadow-lg">
            <span className="text-primary font-bold text-3xl">ب</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-3">
            نماذج شركة مخازن بلقيس للأدوية
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
            نظام إلكتروني لإدارة وطباعة النماذج الرسمية للشركة
          </p>
          {user && (
            <p className="text-primary-foreground/60 text-sm mt-2">
              مرحباً {user.displayName} • {user.role === 'admin' ? 'مدير النظام' : user.role === 'branch-manager' ? 'مدير فرع' : 'مندوب'}
            </p>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {formCards.map((card) => (
            <Link
              key={card.path}
              to={card.path}
              className="group bg-card rounded-xl border shadow-sm hover:shadow-md transition-all p-6 flex flex-col items-center text-center gap-4 hover:-translate-y-1"
            >
              <div className="bg-secondary rounded-full p-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <card.icon className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-card-foreground">{card.title}</h3>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
