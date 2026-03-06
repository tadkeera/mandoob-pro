import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { exportData, importData, getAll } from "@/lib/db";
import { getFilesByFolder, deleteFile } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";
import { Download, Upload, Database, Trash2, Clock, RefreshCw } from "lucide-react";
import { createAutoBackup } from "@/lib/forumStorage";

const DataManagement = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [recordCount, setRecordCount] = useState(getAll().length);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBackups = async () => {
    const files = await getFilesByFolder('backup');
    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setBackups(files);
  };

  useEffect(() => { loadBackups(); }, []);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bilquis-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "تم التصدير", description: "تم تحميل النسخة الاحتياطية بنجاح" });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (importData(text)) {
        setRecordCount(getAll().length);
        toast({ title: "تم الاستيراد", description: "تمت استعادة البيانات بنجاح" });
      } else {
        toast({ title: "خطأ", description: "ملف غير صالح", variant: "destructive" });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleManualBackup = async () => {
    setLoading(true);
    try {
      await createAutoBackup();
      await loadBackups();
      toast({ title: "تم الحفظ", description: "تم إنشاء نسخة احتياطية جديدة" });
    } catch {
      toast({ title: "خطأ", description: "فشل في إنشاء النسخة الاحتياطية", variant: "destructive" });
    }
    setLoading(false);
  };

  const handleRestoreBackup = (data: string) => {
    if (importData(data)) {
      setRecordCount(getAll().length);
      toast({ title: "تمت الاستعادة", description: "تمت استعادة البيانات من النسخة الاحتياطية" });
    } else {
      toast({ title: "خطأ", description: "فشل في استعادة البيانات", variant: "destructive" });
    }
  };

  const handleDeleteBackup = async (id: string) => {
    await deleteFile(id);
    await loadBackups();
    toast({ title: "تم الحذف", description: "تم حذف النسخة الاحتياطية" });
  };

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2">
        <Database className="h-6 w-6" /> إدارة البيانات
      </h1>
      <div className="grid gap-6 max-w-2xl">
        <div className="bg-card rounded-lg shadow-md p-6 border">
          <p className="text-muted-foreground mb-2">عدد السجلات المحفوظة: <strong className="text-foreground">{recordCount}</strong></p>
        </div>
        <div className="bg-card rounded-lg shadow-md p-6 border">
          <h2 className="font-bold text-lg mb-3">نسخ احتياطي</h2>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExport} className="gap-2"><Download className="h-4 w-4" />تحميل نسخة احتياطية</Button>
            <Button onClick={handleManualBackup} variant="outline" className="gap-2" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />نسخ احتياطي يدوي
            </Button>
          </div>
        </div>
        <div className="bg-card rounded-lg shadow-md p-6 border">
          <h2 className="font-bold text-lg mb-3">استعادة البيانات</h2>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleImport} className="hidden" />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2"><Upload className="h-4 w-4" />استعادة من ملف</Button>
        </div>
        {backups.length > 0 && (
          <div className="bg-card rounded-lg shadow-md p-6 border">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5" /> النسخ الاحتياطية التلقائية
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between bg-muted/50 rounded-md p-3 text-sm">
                  <div>
                    <span className="font-medium">{backup.name}</span>
                    <span className="text-xs text-muted-foreground mr-2">{new Date(backup.createdAt).toLocaleString("ar-YE")}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleRestoreBackup(backup.data)} className="text-xs gap-1">
                      <RefreshCw className="h-3 w-3" />استعادة
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteBackup(backup.id)} className="text-destructive text-xs">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataManagement;
