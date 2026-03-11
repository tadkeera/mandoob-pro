import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FormHeader from "@/components/FormHeader";
import { save } from "@/lib/db";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw, Plus, Trash2, Eye } from "lucide-react";

interface BonusItem { name: string; qty: string; bonusPercent: string; compensation: string; }

const ExtraBonusForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({ date: "", branch: "", recipient: "", subject: "", invoice: "", paymentType: "", rep: "" });
  const [items, setItems] = useState<BonusItem[]>([]);
  const [newItem, setNewItem] = useState<BonusItem>({ name: "", qty: "", bonusPercent: "", compensation: "" });
  const [showPreview, setShowPreview] = useState(false);

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));
  const addItem = () => { if (!newItem.name.trim()) return; setItems(prev => [...prev, { ...newItem }]); setNewItem({ name: "", qty: "", bonusPercent: "", compensation: "" }); };
  const removeItem = (i: number) => setItems(prev => prev.filter((_, idx) => idx !== i));

  const handleSave = () => {
    save({ type: "extra-bonus", data: { ...formData, items, clientName: formData.subject }, userId: user?.id });
    toast({ title: "تم الحفظ", description: "تم حفظ نموذج البونص الإضافي بنجاح" });
  };

  const handleReset = () => { setFormData({ date: "", branch: "", recipient: "", subject: "", invoice: "", paymentType: "", rep: "" }); setItems([]); };

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="bg-card rounded-lg shadow-md p-4 md:p-6 mb-6">
        <h2 className="text-xl font-bold text-primary mb-4">إدخال بيانات: نموذج بونص إضافي</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>التاريخ</Label><Input type="date" value={formData.date} onChange={e => update("date", e.target.value)} /></div>
          <div><Label>الفرع</Label><Input value={formData.branch} onChange={e => update("branch", e.target.value)} /></div>
          <div><Label>الأخ/ (المرسل إليه)</Label><Input value={formData.recipient} onChange={e => update("recipient", e.target.value)} /></div>
          <div><Label>الموضوع</Label><Input value={formData.subject} onChange={e => update("subject", e.target.value)} /></div>
          <div><Label>رقم الفاتورة</Label><Input value={formData.invoice} onChange={e => update("invoice", e.target.value)} /></div>
          <div>
            <Label>نوع الدفع</Label>
            <Select value={formData.paymentType} onValueChange={v => update("paymentType", v)}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent><SelectItem value="نقداً">نقداً</SelectItem><SelectItem value="آجل">آجل</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>المندوب</Label><Input value={formData.rep} onChange={e => update("rep", e.target.value)} /></div>
        </div>
        <hr className="my-4 border-border" />
        <Label className="mb-2 block">الأصناف</Label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end bg-muted p-4 rounded-lg border">
          <div><Label className="text-xs">اسم الصنف</Label><Input value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} /></div>
          <div><Label className="text-xs">الكمية المشتراة</Label><Input value={newItem.qty} onChange={e => setNewItem(p => ({ ...p, qty: e.target.value }))} /></div>
          <div><Label className="text-xs">نسبة البونص</Label><Input value={newItem.bonusPercent} onChange={e => setNewItem(p => ({ ...p, bonusPercent: e.target.value }))} /></div>
          <div><Label className="text-xs">كمية التعويض</Label><Input value={newItem.compensation} onChange={e => setNewItem(p => ({ ...p, compensation: e.target.value }))} /></div>
          <Button onClick={addItem} className="gap-1"><Plus className="h-4 w-4" />إضافة</Button>
        </div>
        {items.length > 0 && (
          <ul className="mt-3 space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-center justify-between bg-secondary/30 border border-secondary rounded-md px-3 py-2 text-sm">
                <span>{item.name} | كمية: {item.qty} | بونص: {item.bonusPercent} | تعويض: {item.compensation}</span>
                <Button variant="ghost" size="icon" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-3 mt-6">
          <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" />حفظ</Button>
          <Button variant="outline" onClick={() => setShowPreview(true)} className="gap-2"><Eye className="h-4 w-4" />معاينة النموذج</Button>
          <Button variant="outline" onClick={handleReset} className="gap-2"><RotateCcw className="h-4 w-4" />مسح</Button>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>معاينة: نموذج بونص إضافي</DialogTitle>
          </DialogHeader>
          <div id="extra-bonus-print" className="print-page" style={{ border: "2px solid #000", borderRadius: "5px", padding: "16px" }}>
            <FormHeader />
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontWeight: "bold" }}>
              <div>التاريخ: <span className="out-text">{formData.date}</span></div>
              <div>الفرع: <span className="out-text">{formData.branch}</span></div>
            </div>
            <div style={{ fontWeight: "bold", marginBottom: "5px" }}>الأخ/ <span className="out-text">{formData.recipient}</span></div>
            <div style={{ textAlign: "left", fontWeight: "bold", marginBottom: "5px" }}>المحترم</div>
            <p style={{ textAlign: "center" }}>بعد التحية ،،،،،</p>
            <div style={{ fontWeight: "bold", margin: "10px 0" }}>الموضوع: بونص اضافي او دعم <span className="out-text">{formData.subject}</span></div>
            <p>بالإشارة الى الموضوع أعلاه نرجو تكرمكم بالموافقة على صرف البونص الإضافي للمذكور وذلك على النحو التالي :-</p>
            <table className="compact-table">
              <thead><tr><th>الرقم</th><th>اسم الصنف</th><th>الكمية المشتراة</th><th>نسبة البونص</th><th>كمية التعويض عدد</th></tr></thead>
              <tbody>
                {items.length === 0 ? <tr><td colSpan={5} style={{ color: "#777" }}>لم يتم إضافة أصناف</td></tr> : items.map((item, i) => <tr key={i}><td>{i + 1}</td><td>{item.name}</td><td>{item.qty}</td><td>{item.bonusPercent}</td><td>{item.compensation}</td></tr>)}
              </tbody>
            </table>
            <div style={{ fontWeight: "bold", marginBottom: "15px", marginTop: "8px" }}>وذلك بفاتورة رقم: <span className="out-text">{formData.invoice}</span> (<span className="out-text">{formData.paymentType}</span>)</div>
            <p>وعليه .... التزم بتصريف البضاعة المباعة وعدم إرجاعها ونتحمل المسئولية كامله .</p>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", fontWeight: "bold", textAlign: "center", alignItems: "center" }}>
              <div>المندوب<br /><span className="out-text">{formData.rep}</span></div>
              <div>مدير الفرع<br />...................</div>
              <div>المكتب العلمي<br />...................</div>
              <div>مدير القطاع<br />...................</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExtraBonusForm;
