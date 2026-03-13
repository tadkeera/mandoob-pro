import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, type User, saveManagerName } from "@/lib/supabaseAuth";
import { getAll, type FormRecord } from "@/lib/supabaseDb";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bell, Check, Save, User as UserIcon, Loader2 } from "lucide-react";

const ManagerDashboard = () => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [representatives, setRepresentatives] = useState<User[]>([]);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [managerName, setManagerName] = useState<string>("");
  const [savedManagerName, setSavedManagerName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const users = await getUsers();
    const reps = users.filter(u => u.role === "representative");
    const allRecords = await getAll();

    const counts: Record<string, number> = {};
    reps.forEach(rep => {
      counts[rep.id] = allRecords.filter(r => r.userId === rep.id && r.status === "pending-approval").length;
    });

    reps.sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0));
    setRepresentatives(reps);
    setPendingCounts(counts);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    if (user) {
      const name = user.managerName || user.displayName || "";
      setSavedManagerName(name);
      setManagerName(name);
    }
  }, [user]);

  const handleSaveName = async () => {
    if (!user) return;
    if (!managerName.trim()) {
      toast({ title: "خطأ", description: "يرجى إدخال اسم مدير الفرع", variant: "destructive" });
      return;
    }
    setSaving(true);
    await saveManagerName(user.id, managerName.trim());
    await refreshUser();
    setSavedManagerName(managerName.trim());
    setSaving(false);
    toast({ title: "✅ تم الحفظ", description: `تم حفظ اسم مدير الفرع: ${managerName.trim()}` });
  };

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">لوحة تحكم مدير الفرع</h1>
      </div>

      {/* Manager Name Setting */}
      <div className="bg-card border rounded-xl p-5 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <UserIcon className="h-5 w-5 text-primary" />
          <h2 className="text-base font-bold text-card-foreground">اسم مدير الفرع للاعتماد</h2>
        </div>
        {savedManagerName && (
          <div className="mb-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <Check className="h-4 w-4" />
            الاسم المحفوظ: <strong>{savedManagerName}</strong>
          </div>
        )}
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Label className="text-sm mb-1 block">اسم مدير الفرع</Label>
            <Input
              value={managerName}
              onChange={e => setManagerName(e.target.value)}
              placeholder="أدخل اسم مدير الفرع..."
            />
          </div>
          <Button onClick={handleSaveName} className="gap-2 shrink-0" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ الاسم
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          سيظهر هذا الاسم بجانب "مدير الفرع" في النماذج المعتمدة عند الطباعة.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {representatives.map(rep => (
            <div
              key={rep.id}
              onClick={() => navigate(`/manager-dashboard/rep/${rep.id}`)}
              className="bg-card rounded-xl border shadow-sm hover:shadow-md transition-all p-6 cursor-pointer hover:-translate-y-1 relative"
            >
              {(pendingCounts[rep.id] || 0) > 0 && (
                <div className="absolute -top-2 -left-2 bg-destructive text-destructive-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-md">
                  {pendingCounts[rep.id]}
                </div>
              )}
              <div className="flex flex-col items-center text-center gap-3">
                <div className="bg-primary/10 rounded-full p-4">
                  <Bell className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-card-foreground">{rep.displayName}</h3>
                <p className="text-sm text-muted-foreground">
                  {pendingCounts[rep.id] || 0} نموذج بانتظار الاعتماد
                </p>
              </div>
            </div>
          ))}
          {representatives.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              لا يوجد مندوبين مسجلين. يرجى إضافة مندوبين من صفحة إدارة المستخدمين.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
