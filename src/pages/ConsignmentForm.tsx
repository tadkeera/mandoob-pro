import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FormHeader from "@/components/FormHeader";
import { save } from "@/lib/supabaseDb";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw, Plus, Trash2, UserPlus, Eye, Loader2 } from "lucide-react";

interface ConsignmentItem { name: string; qty: string; date: string; }
interface ClientGroup { clientName: string; items: ConsignmentItem[]; }

const ConsignmentForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ date: "", branch: "", rep: "" });
  const [clients, setClients] = useState<ClientGroup[]>([{ clientName: "", items: [] }]);
  const [newItems, setNewItems] = useState<Record<number, ConsignmentItem>>({});
  const [showPreview, setShowPreview] = useState(false);

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));
  const updateClientName = (idx: number, name: string) => setClients(prev => prev.map((c, i) => i === idx ? { ...c, clientName: name } : c));
  const getNewItem = (idx: number): ConsignmentItem => newItems[idx] || { name: "", qty: "", date: "" };
  const setNewItem = (idx: number, item: ConsignmentItem) => setNewItems(prev => ({ ...prev, [idx]: item }));

  const addItem = (clientIdx: number) => {
    const item = getNewItem(clientIdx);
    if (!item.name.trim()) return;
    setClients(prev => prev.map((c, i) => i === clientIdx ? { ...c, items: [...c.items, { ...item }] } : c));
    setNewItem(clientIdx, { name: "", qty: "", date: "" });
  };

  const removeItem = (clientIdx: number, itemIdx: number) => setClients(prev => prev.map((c, i) => i === clientIdx ? { ...c, items: c.items.filter((_, j) => j !== itemIdx) } : c));
  const addClient = () => setClients(prev => [...prev, { clientName: "", items: [] }]);
  const removeClient = (idx: number) => { if (clients.length <= 1) return; setClients(prev => prev.filter((_, i) => i !== idx)); };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const allClients = clients.map(c => c.clientName).filter(Boolean).join("، ");
    const result = await save({
      type: "consignment",
      data: { ...formData, clients, clientName: allClients },
      userId: user.id,
    });
    setSaving(false);
    if (result) {
      toast({ title: "✅ تم الحفظ", description: "تم حفظ نموذج التصريف بنجاح" });
    } else {
      toast({ title: "خطأ", description: "فشل في حفظ النموذج", variant: "destructive" });
    }
  };

  const handleReset = () => { setFormData({ date: "", branch: "", rep: "" }); setClients([{ clientName: "", items: [] }]); };

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="bg-card rounded-lg shadow-md p-4 md:p-6 mb-6">
        <h2 className="text-xl font-bold text-primary mb-4">إدخال بيانات: نموذج تصريف</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>التاريخ</Label><Input type="date" value={formData.date} onChange={e => update("date", e.target.value)} /></div>
          <div><Label>الفرع</Label><Input value={formData.branch} onChange={e => update("branch", e.target.value)} /></div>
          <div><Label>المندوب</Label><Input value={formData.rep} onChange={e => update("rep", e.target.value)} /></div>
        </div>
        <hr className="my-4 border-border" />
        {clients.map((client, cIdx) => (
          <div key={cIdx} className="mb-4 border border-border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-bold">العميل {cIdx + 1}</Label>
              {clients.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeClient(cIdx)} className="text-destructive gap-1"><Trash2 className="h-4 w-4" />حذف العميل</Button>}
            </div>
            <Input placeholder="اسم العميل" value={client.clientName} onChange={e => updateClientName(cIdx, e.target.value)} className="mb-3" />
            <Label className="text-xs mb-2 block">الأصناف</Label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-background p-3 rounded-lg border">
              <div><Label className="text-xs">اسم الصنف</Label><Input value={getNewItem(cIdx).name} onChange={e => setNewItem(cIdx, { ...getNewItem(cIdx), name: e.target.value })} /></div>
              <div><Label className="text-xs">الكمية</Label><Input value={getNewItem(cIdx).qty} onChange={e => setNewItem(cIdx, { ...getNewItem(cIdx), qty: e.target.value })} /></div>
              <div><Label className="text-xs">التاريخ</Label><Input type="date" value={getNewItem(cIdx).date} onChange={e => setNewItem(cIdx, { ...getNewItem(cIdx), date: e.target.value })} /></div>
              <Button onClick={() => addItem(cIdx)} className="gap-1"><Plus className="h-4 w-4" />إضافة</Button>
            </div>
            {client.items.length > 0 && (
              <ul className="mt-2 space-y-1">
                {client.items.map((item, iIdx) => (
                  <li key={iIdx} className="flex items-center justify-between bg-secondary/30 border border-secondary rounded-md px-3 py-1.5 text-sm">
                    <span>{item.name} | كمية: {item.qty} | تاريخ: {item.date}</span>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(cIdx, iIdx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
        <Button variant="outline" onClick={addClient} className="gap-2 mb-4"><UserPlus className="h-4 w-4" />إضافة عميل آخر</Button>
        <div className="flex flex-wrap gap-3 mt-4">
          <Button onClick={handleSave} className="gap-2" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            حفظ
          </Button>
          <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-2"><Eye className="h-4 w-4" />معاينة النموذج</Button>
          <Button variant="outline" onClick={handleReset} className="gap-2"><RotateCcw className="h-4 w-4" />مسح</Button>
        </div>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>معاينة: نموذج تصريف</DialogTitle></DialogHeader>
          <div id="consignment-print" className="print-page" style={{ border: "2px solid #000", borderRadius: "5px", padding: "16px" }}>
            <FormHeader />
            <div style={{ textAlign: "center", fontWeight: "bold", marginBottom: "10px" }}>بسم الله الرحمن الرحيم</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontWeight: "bold" }}>
              <div>التاريخ: <span className="out-text">{formData.date}</span></div>
              <div>الفرع: <span className="out-text">{formData.branch}</span></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginBottom: "15px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}><span>الاخ / مدير القطاع</span><span>الاخ / مدير المكتب العلمي</span></div>
              <div style={{ alignSelf: "flex-end" }}>المحترمين</div>
            </div>
            <p>بعد التحية ،،،،،،،،،،</p>
            <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px", margin: "15px 0", textDecoration: "underline" }}>الموضوع: إنزال بضاعة تحت التصريف</div>
            <p>اشارة الى الموضوع اعلاه ، نرجو منكم الموافقة على أنزال الاصناف التالية تحت التصريف وعلى مسئوليتي متابعتها أولاً بأول وعدم وجود أي منتهيات والاصناف هي :</p>
            {clients.map((client, cIdx) => (
              <div key={cIdx} style={{ marginBottom: "10px" }}>
                <div style={{ fontWeight: "bold", marginBottom: "5px" }}>العميل: <span className="out-text">{client.clientName}</span></div>
                <table className="compact-table">
                  <thead><tr><th>اسم الصنف</th><th>الكمية</th><th>التاريخ</th></tr></thead>
                  <tbody>
                    {client.items.length === 0 ? <tr><td colSpan={3} style={{ color: "#777" }}>لم يتم إضافة أصناف</td></tr> : client.items.map((item, i) => <tr key={i}><td>{item.name}</td><td>{item.qty}</td><td>{item.date}</td></tr>)}
                  </tbody>
                </table>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "50px", fontWeight: "bold", textAlign: "center", alignItems: "center" }}>
              <div>المندوب<br /><span className="out-text">{formData.rep}</span></div>
              <div>مدير الفرع<br /><br />...................</div>
              <div>المكتب العلمي<br /><br />...................</div>
              <div>مدير القطاع<br /><br />...................</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsignmentForm;
