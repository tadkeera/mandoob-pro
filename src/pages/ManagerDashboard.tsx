import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, type User, getManagerSignature, saveManagerSignature, deleteManagerSignature } from "@/lib/auth";
import { getAll } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PenTool, Bell, Trash2, Check, Upload } from "lucide-react";

const ManagerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [representatives, setRepresentatives] = useState<User[]>([]);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [showSignatureSettings, setShowSignatureSettings] = useState(false);
  const [managerSig, setManagerSig] = useState<string | null>(null);
  const [sigPreview, setSigPreview] = useState<string | null>(null);

  const loadData = () => {
    const users = getUsers();
    const reps = users.filter(u => u.role === "representative");
    const allRecords = getAll();

    const counts: Record<string, number> = {};
    const oldestPending: Record<string, number> = {};

    reps.forEach(rep => {
      const pendingRecords = allRecords.filter(r => r.userId === rep.id && r.status === 'pending-approval');
      counts[rep.id] = pendingRecords.length;
      if (pendingRecords.length > 0) {
        const oldest = pendingRecords.reduce((min, r) => {
          const t = new Date(r.submittedForApprovalAt || r.createdAt).getTime();
          return t < min ? t : min;
        }, Infinity);
        oldestPending[rep.id] = oldest;
      } else {
        oldestPending[rep.id] = Infinity;
      }
    });

    reps.sort((a, b) => (oldestPending[a.id] || Infinity) - (oldestPending[b.id] || Infinity));
    setRepresentatives(reps);
    setPendingCounts(counts);
  };

  const loadManagerSig = () => {
    if (user) {
      const sig = getManagerSignature(user.id);
      setManagerSig(sig);
    }
  };

  useEffect(() => {
    loadData();
    loadManagerSig();
  }, [user]);

  // Direct file reading — no canvas needed
  const handleSigFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "خطأ", description: "يرجى اختيار ملف صورة فقط", variant: "destructive" });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (result) {
        setSigPreview(result);
      }
    };
    reader.onerror = () => {
      toast({ title: "خطأ", description: "تعذّر قراءة الملف", variant: "destructive" });
    };
    reader.readAsDataURL(file);
    // Reset input
    e.target.value = "";
  };

  const handleSaveSignature = () => {
    if (!user) {
      toast({ title: "خطأ", description: "يرجى تسجيل الدخول أولاً", variant: "destructive" });
      return;
    }
    if (!sigPreview) {
      toast({ title: "لا توجد صورة", description: "الرجاء اختيار صورة التوقيع أولاً", variant: "destructive" });
      return;
    }
    try {
      saveManagerSignature(user.id, sigPreview);
      const saved = getManagerSignature(user.id);
      if (saved) {
        setManagerSig(saved);
        setSigPreview(null);
        toast({ title: "✅ تم الحفظ", description: "تم حفظ توقيع مدير الفرع بنجاح" });
      } else {
        toast({ title: "خطأ", description: "فشل حفظ التوقيع، يرجى المحاولة مجدداً", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "خطأ", description: "حدث خطأ أثناء الحفظ: " + String(err), variant: "destructive" });
    }
  };

  const handleDeleteSignature = () => {
    if (!user) return;
    deleteManagerSignature(user.id);
    setManagerSig(null);
    setSigPreview(null);
    toast({ title: "تم الحذف", description: "تم حذف توقيع مدير الفرع" });
  };

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">لوحة تحكم مدير الفرع</h1>
        <Button
          variant="outline"
          onClick={() => { loadManagerSig(); setShowSignatureSettings(true); }}
          className="gap-2"
        >
          <PenTool className="h-4 w-4" /> إعدادات التوقيع
        </Button>
      </div>

      {!managerSig && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
          ⚠️ لم يتم إعداد توقيع مدير الفرع بعد. يرجى إضافة توقيعك من "إعدادات التوقيع" لتتمكن من اعتماد النماذج.
        </div>
      )}

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

      {/* Manager Signature Settings Dialog */}
      <Dialog
        open={showSignatureSettings}
        onOpenChange={(open) => {
          setShowSignatureSettings(open);
          if (!open) setSigPreview(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إعدادات توقيع مدير الفرع</DialogTitle>
          </DialogHeader>

          {/* Current Signature */}
          {managerSig && (
            <div className="text-center mb-4 p-4 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium text-muted-foreground mb-2">التوقيع الحالي المحفوظ</p>
              <img
                src={managerSig}
                alt="توقيع المدير"
                className="max-h-24 max-w-full object-contain mx-auto border rounded bg-background p-2"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSignature}
                className="mt-3 gap-1"
              >
                <Trash2 className="h-4 w-4" /> حذف التوقيع
              </Button>
            </div>
          )}

          {/* Upload Area */}
          <div className="space-y-3">
            <label className="block">
              <div className="bg-muted border-2 border-dashed border-primary/40 rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-muted/80 transition-colors">
                <Upload className="h-10 w-10 mx-auto text-primary/50 mb-2" />
                <p className="text-sm font-medium text-foreground">انقر لاختيار صورة التوقيع</p>
                <p className="text-xs text-muted-foreground mt-1">PNG / JPG / WebP</p>
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSigFile}
              />
            </label>
          </div>

          {/* Preview */}
          {sigPreview && (
            <div className="mt-4 p-4 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium text-muted-foreground mb-2 text-center">معاينة الصورة المختارة</p>
              <img
                src={sigPreview}
                alt="معاينة التوقيع"
                className="max-h-24 max-w-full object-contain mx-auto border rounded bg-background p-2"
              />
              <div className="mt-4 flex gap-2 justify-center">
                <Button onClick={handleSaveSignature} className="gap-1 bg-green-600 hover:bg-green-700 text-white">
                  <Check className="h-4 w-4" /> حفظ التوقيع
                </Button>
                <Button variant="outline" onClick={() => setSigPreview(null)}>إلغاء</Button>
              </div>
            </div>
          )}

          {/* Debug info */}
          <p className="text-xs text-muted-foreground text-center mt-2">
            المستخدم: {user?.displayName || "غير محدد"} | ID: {user?.id?.slice(0, 8)}...
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerDashboard;
