import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { saveSignature, getSignature, deleteSignature } from "@/lib/signature";
import { Upload, Trash2, Check, Image } from "lucide-react";

const SignaturePage = () => {
  const { user } = useAuth();
  const [preview, setPreview] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setSaved(getSignature(user?.id));
  }, [user]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "خطأ", description: "يرجى اختيار ملف صورة فقط", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        setPreview(canvas.toDataURL("image/png"));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!preview) return;
    saveSignature(preview, user?.id);
    setSaved(preview);
    setPreview(null);
    toast({ title: "تم الحفظ", description: "تم حفظ التوقيع بنجاح" });
  };

  const handleDelete = () => {
    deleteSignature(user?.id);
    setSaved(null);
    setPreview(null);
    toast({ title: "تم الحذف", description: "تم حذف التوقيع" });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg animate-fade-in">
      <h1 className="text-2xl font-bold text-primary text-center mb-6">إدارة التوقيع</h1>

      {saved && (
        <div className="bg-card border rounded-xl p-6 mb-6 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-3">التوقيع المحفوظ حالياً</p>
          <div className="inline-block border-2 border-dashed border-primary/30 rounded-lg p-4 bg-background">
            <img src={saved} alt="التوقيع المحفوظ" className="max-h-24 max-w-full object-contain" />
          </div>
          <div className="mt-4">
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 ml-1" />
              حذف التوقيع
            </Button>
          </div>
        </div>
      )}

      <div
        className="bg-card border-2 border-dashed border-primary/40 rounded-xl p-8 text-center cursor-pointer hover:border-primary transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFile} />
        <Image className="h-12 w-12 mx-auto text-primary/50 mb-3" />
        <p className="text-sm font-medium text-muted-foreground mb-1">انقر لاختيار صورة التوقيع</p>
        <p className="text-xs text-muted-foreground">يُفضل صورة PNG بخلفية شفافة</p>
      </div>

      {preview && (
        <div className="bg-card border rounded-xl p-6 mt-6 text-center">
          <p className="text-sm font-medium text-muted-foreground mb-3">معاينة</p>
          <div className="inline-block border rounded-lg p-4 bg-background">
            <img src={preview} alt="معاينة التوقيع" className="max-h-24 max-w-full object-contain" />
          </div>
          <div className="mt-4">
            <Button onClick={handleSave}>
              <Check className="h-4 w-4 ml-1" />
              حفظ التوقيع
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignaturePage;
