import { Link } from "react-router-dom";
import { FileText, ClipboardList, Gift } from "lucide-react";

const categories = [
  {
    title: "سجلات نماذج دعم الأطباء",
    description: "عرض وإدارة نماذج دعم الأطباء المحفوظة",
    path: "/reports/doctor-support",
    icon: FileText,
  },
  {
    title: "سجلات نماذج التصريف",
    description: "عرض وإدارة نماذج التصريف المحفوظة",
    path: "/reports/consignment",
    icon: ClipboardList,
  },
  {
    title: "سجلات نماذج البونص الإضافي",
    description: "عرض وإدارة نماذج البونص الإضافي المحفوظة",
    path: "/reports/extra-bonus",
    icon: Gift,
  },
];

const ReportsIndex = () => {
  return (
    <div className="container mx-auto px-4 py-12 animate-fade-in">
      <h1 className="text-2xl font-bold text-primary text-center mb-8">السجلات المحفوظة</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {categories.map((cat) => (
          <Link
            key={cat.path}
            to={cat.path}
            className="group bg-card rounded-xl border shadow-sm hover:shadow-md transition-all p-6 flex flex-col items-center text-center gap-4 hover:-translate-y-1"
          >
            <div className="bg-secondary rounded-full p-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <cat.icon className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-card-foreground">{cat.title}</h3>
            <p className="text-sm text-muted-foreground">{cat.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ReportsIndex;
