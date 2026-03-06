import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, type User, getManagerSignature, saveManagerSignature, deleteManagerSignature } from "@/lib/auth";
import { getAll } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PenTool, Bell, Trash2, Check, Image } from "lucide-react";

const ManagerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [representatives, setRepresentatives] = useState<User[]>([]);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [showSignatureSettings, setShowSignatureSettings] = useState(false);
  const [managerSig, setManagerSig] = useState<string | null>(null);
  const [sigPreview, setSigPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  // Load manager signature separately so it always reflects latest saved value
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

  const handleSigFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset the input so the same file can be re-selected if needed
    e.target.value = "";
    if (!file.type.startsWith("image/")) {
      toast({ title: "خطأ", description: "يرجى اختيار ملف صورة فقط", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      if (!result) return;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        setSigPreview(dataUrl);
      };
      img.onerror = () => {
        toast({ title: "خطأ", description: "تعذّر قراءة الصورة، جرّب صيغة أخرى", variant: "destructive" });
      };
      img.src = result;
    };
    reader.onerror = () => {
      toast({ title: "خطأ", description: "تعذّر قراءة الملف", variant: "destructive" });
    };
    reader.readAsDataURL(file);
  };

  const saveManagerSig = () => {
    if (!sigPreview || !user) {
      toast({ title: "لا توجد صورة", description: "الرجاء اختيار صورة التوقيع أولاً", variant: "destructive" });
      return;
    }
    saveManagerSignature(user.id, sigPreview);
    setManagerSig(sigPreview);
    setSigPreview(null);
    toast({ title: "✅ تم الحفظ", description: "تم حفظ توقيع مدير الفرع بنجاح" });
  };

  const deleteManagerSig = () => {
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
        <Button variant="outline" onClick={() => { loadManagerSig(); setShowSignatureSettings(true); }} className="gap-2">
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

      {/* Manager Signature Settings */}
      <Dialog open={showSignatureSettings} onOpenChange={(open) => {
        setShowSignatureSettings(open);
        if (!open) setSigPreview(null);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>إعدادات توقيع مدير الفرع</DialogTitle></DialogHeader>

          {managerSig && (
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground mb-2">التوقيع الحالي</p>
              <div className="inline-block border-2 border-dashed border-primary/30 rounded-lg p-4 bg-background">
                <img src={managerSig} alt="توقيع المدير" className="max-h-20 max-w-full object-contain" />
              </div>
              <div className="mt-2">
                <Button variant="destructive" size="sm" onClick={deleteManagerSig}>
                  <Trash2 className="h-4 w-4 ml-1" /> حذف التوقيع
                </Button>
              </div>
            </div>
          )}

          <div
            className="bg-muted border-2 border-dashed border-primary/40 rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              className="hidden"
              onChange={handleSigFile}
            />
            <Image className="h-10 w-10 mx-auto text-primary/50 mb-2" />
            <p className="text-sm text-muted-foreground">انقر لاختيار صورة التوقيع</p>
            <p className="text-xs text-muted-foreground mt-1">(PNG / JPG / WebP)</p>
          </div>

          {sigPreview && (
            <div className="text-center mt-4">
              <p className="text-sm text-muted-foreground mb-2">معاينة</p>
              <div className="inline-block border rounded-lg p-4 bg-background">
                <img src={sigPreview} alt="معاينة" className="max-h-20 max-w-full object-contain" />
              </div>
              <div className="mt-3 flex gap-2 justify-center">
                <Button onClick={saveManagerSig} className="gap-1">
                  <Check className="h-4 w-4" /> حفظ التوقيع
                </Button>
                <Button variant="outline" onClick={() => setSigPreview(null)}>إلغاء</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerDashboard;
