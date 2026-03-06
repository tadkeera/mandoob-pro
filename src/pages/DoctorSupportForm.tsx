import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FormHeader from "@/components/FormHeader";
import { save } from "@/lib/db";
import { getSignature } from "@/lib/signature";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Save, RotateCcw, Plus, Trash2 } from "lucide-react";

interface Pharmacy {
  name: string;
  phone: string;
  amount: string;
}

const DoctorSupportForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    date: "", supervisor: "", amount: "", rep: "",
    doctor: "", specialty: "", morning: "", evening: "",
    landline: "", mobile: "", purpose: "", items: "",
  });
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [newPharmacy, setNewPharmacy] = useState<Pharmacy>({ name: "", phone: "", amount: "" });
  const printRef = useRef<HTMLDivElement>(null);

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));
  const addPharmacy = () => {
    if (!newPharmacy.name.trim()) return;
    setPharmacies(prev => [...prev, { ...newPharmacy }]);
    setNewPharmacy({ name: "", phone: "", amount: "" });
  };
  const removePharmacy = (index: number) => setPharmacies(prev => prev.filter((_, i) => i !== index));

  const handleSave = () => {
    save({ type: "doctor-support", data: { ...formData, pharmacies, doctorName: formData.doctor }, userId: user?.id });
    toast({ title: "تم الحفظ", description: "تم حفظ الاستمارة بنجاح" });
  };

  // FIX: حفظ مع التوقيع - يحفظ السجل وتظهر رسالة نجاح واضحة
  const handleSaveWithSignature = () => {
    const sig = getSignature(user?.id);
    if (!sig) {
      toast({ title: "لا يوجد توقيع", description: "يرجى رفع توقيع أولاً من صفحة إدارة التوقيع", variant: "destructive" });
      return;
    }
    save({ type: "doctor-support", data: { ...formData, pharmacies, doctorName: formData.doctor }, userId: user?.id, repSignature: sig });
    toast({ title: "تم الحفظ مع التوقيع ✓", description: "تم حفظ الاستمارة مع التوقيع بنجاح وأُضيفت للسجلات" });
  };

  const handleReset = () => {
    setFormData({ date: "", supervisor: "", amount: "", rep: "", doctor: "", specialty: "", morning: "", evening: "", landline: "", mobile: "", purpose: "", items: "" });
    setPharmacies([]);
  };

  const repSignature = getSignature(user?.id);

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="bg-card rounded-lg shadow-md p-4 md:p-6 mb-6 no-print">
        <h2 className="text-xl font-bold text-primary mb-4">إدخال بيانات: استمارة دعم طبيب</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>التاريخ</Label><Input type="date" value={formData.date} onChange={e => update("date", e.target.value)} /></div>
          <div><Label>مشرف شركة</Label><Input value={formData.supervisor} onChange={e => update("supervisor", e.target.value)} /></div>
          <div><Label>مبلغ وقدره</Label><Input value={formData.amount} onChange={e => update("amount", e.target.value)} /></div>
          <div><Label>مقدم الطلب</Label><Input value={formData.rep} onChange={e => update("rep", e.target.value)} /></div>
        </div>
        <hr className="my-4 border-border" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>اسم الدكتور</Label><Input value={formData.doctor} onChange={e => update("doctor", e.target.value)} /></div>
          <div><Label>أخصائي</Label><Input value={formData.specialty} onChange={e => update("specialty", e.target.value)} /></div>
          <div><Label>يعمل صباحاً في</Label><Input value={formData.morning} onChange={e => update("morning", e.target.value)} /></div>
          <div><Label>يعمل مساءً في</Label><Input value={formData.evening} onChange={e => update("evening", e.target.value)} /></div>
          <div><Label>تلفون ثابت</Label><Input value={formData.landline} onChange={e => update("landline", e.target.value)} /></div>
          <div><Label>تلفون سيار</Label><Input value={formData.mobile} onChange={e => update("mobile", e.target.value)} /></div>
          <div className="md:col-span-2"><Label>مقابل</Label><Input value={formData.purpose} onChange={e => update("purpose", e.target.value)} /></div>
          <div className="md:col-span-2"><Label>لكتابة الأصناف التالية</Label><Input value={formData.items} onChange={e => update("items", e.target.value)} /></div>
        </div>
        <hr className="my-4 border-border" />
        <Label className="mb-2 block">الصيدليات المجاورة للمذكور</Label>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end bg-muted p-4 rounded-lg border">
          <div><Label className="text-xs">اسم الصيدلية</Label><Input value={newPharmacy.name} onChange={e => setNewPharmacy(p => ({ ...p, name: e.target.value }))} /></div>
          <div><Label className="text-xs">رقم الهاتف</Label><Input value={newPharmacy.phone} onChange={e => setNewPharmacy(p => ({ ...p, phone: e.target.value }))} /></div>
          <div><Label className="text-xs">قيمة المشتريات</Label><Input value={newPharmacy.amount} onChange={e => setNewPharmacy(p => ({ ...p, amount: e.target.value }))} /></div>
          <Button onClick={addPharmacy} className="gap-1"><Plus className="h-4 w-4" />إضافة</Button>
        </div>
        {pharmacies.length > 0 && (
          <ul className="mt-3 space-y-2">
            {pharmacies.map((p, i) => (
              <li key={i} className="flex items-center justify-between bg-secondary/30 border border-secondary rounded-md px-3 py-2 text-sm">
                <span><strong>{p.name}</strong> | هاتف: {p.phone || '-'} | قيمة: {p.amount || '-'}</span>
                <Button variant="ghost" size="icon" onClick={() => removePharmacy(i)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-3 mt-6">
          <Button onClick={handleSave} className="gap-2"><Save className="h-4 w-4" />حفظ</Button>
          <Button onClick={handleSaveWithSignature} variant="secondary" className="gap-2"><Save className="h-4 w-4" />حفظ مع التوقيع</Button>
          <Button variant="outline" onClick={handleReset} className="gap-2"><RotateCcw className="h-4 w-4" />مسح</Button>
        </div>
        {!repSignature && (
          <p className="mt-3 text-sm text-muted-foreground">
            ملاحظة: لاستخدام "حفظ مع التوقيع"، يرجى أولاً رفع توقيعك من صفحة <a href="/signature" className="text-primary underline">إدارة التوقيع</a>
          </p>
        )}
      </div>

      <div id="doctor-support-print" ref={printRef} className="print-area print-page">
        <FormHeader />
        <h1 style={{ fontSize: "16px", fontWeight: "bold", margin: "5px 0 10px 0", textAlign: "center" }}>استمارة دعم طبيب</h1>
        <div className="top-half" style={{ marginBottom: "10px" }}>
          <div style={{ fontWeight: "bold", marginBottom: "10px" }}>التاريخ: <span className="out-text">{formData.date}</span></div>
          <div className="flex-row"><span style={{ whiteSpace: "nowrap" }}>الأخ مشرف شركة:</span><span className="dotted-line out-text">{formData.supervisor}</span><span style={{ whiteSpace: "nowrap" }}>المحترم، بعد التحية،</span></div>
          <div className="flex-row"><span style={{ whiteSpace: "nowrap" }}>نرجو منكم الموافقة على صرف مبلغ وقدره (</span><span className="dotted-line out-text">{formData.amount}</span><span style={{ whiteSpace: "nowrap" }}>) فقط.</span></div>
          <div className="flex-row">
            <div style={{ flexBasis: "55%", display: "flex", alignItems: "baseline" }}><span style={{ whiteSpace: "nowrap" }}>للأخ الدكتور:</span><span className="dotted-line out-text">{formData.doctor}</span></div>
            <div style={{ flexBasis: "42%", display: "flex", alignItems: "baseline" }}><span style={{ whiteSpace: "nowrap" }}>أخصائي:</span><span className="dotted-line out-text">{formData.specialty}</span></div>
          </div>
          <div className="flex-row">
            <div style={{ flexBasis: "48%", display: "flex", alignItems: "baseline" }}><span style={{ whiteSpace: "nowrap" }}>يعمل صباحاً في:</span><span className="dotted-line out-text">{formData.morning}</span></div>
            <div style={{ flexBasis: "48%", display: "flex", alignItems: "baseline" }}><span style={{ whiteSpace: "nowrap" }}>ومساءً في:</span><span className="dotted-line out-text">{formData.evening}</span></div>
          </div>
          <div className="flex-row">
            <div style={{ flexBasis: "48%", display: "flex", alignItems: "baseline" }}><span style={{ whiteSpace: "nowrap" }}>تلفون ثابت:</span><span className="dotted-line out-text">{formData.landline}</span></div>
            <div style={{ flexBasis: "48%", display: "flex", alignItems: "baseline" }}><span style={{ whiteSpace: "nowrap" }}>تلفون سيار:</span><span className="dotted-line out-text">{formData.mobile}</span></div>
          </div>
          <div className="flex-row"><span style={{ whiteSpace: "nowrap" }}>مقابل / </span><span className="dotted-line out-text">{formData.purpose}</span></div>
          <div className="flex-row"><span style={{ whiteSpace: "nowrap" }}>لكتابة الأصناف التالية: </span><span className="dotted-line out-text">{formData.items}</span></div>
          <div style={{ marginTop: "5px" }}>
            <span style={{ fontWeight: "bold" }}>والصيدليات المجاورة للمذكور:</span>
            <table className="compact-table">
              <thead><tr><th style={{ width: "40%" }}>اسم الصيدلية</th><th style={{ width: "30%" }}>رقم الهاتف</th><th style={{ width: "30%" }}>قيمة المشتريات</th></tr></thead>
              <tbody>
                {pharmacies.length === 0 ? <tr><td colSpan={3} style={{ color: "#777" }}>لم يتم إضافة صيدليات</td></tr> : pharmacies.map((p, i) => <tr key={i}><td>{p.name}</td><td dir="ltr">{p.phone}</td><td>{p.amount}</td></tr>)}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "5px 0 10px 0", fontSize: "12px", textAlign: "center", fontWeight: "bold" }}>وعليه نلتزم بوفاء المذكور بكتابة الأصناف، وفي حالة عدم الوفاء فنحن نتحمل المسؤولية كاملة.</p>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              مقدم الطلب: <span className="out-text">{formData.rep}</span>
              {repSignature && <img src={repSignature} alt="التوقيع" style={{ width: "90px", height: "45px", objectFit: "contain" }} />}
            </div>
            <div>مدير الفرع: <span style={{ display: "inline-block", borderBottom: "1px dotted #000", minWidth: "120px" }}></span></div>
          </div>
        </div>
        <div className="bottom-half" style={{ fontSize: "12px" }}>
          <div className="box">
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>الأخ / مدير القطاع</span><span className="dotted-line"></span><span>المحترم،</span></div>
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>نرجو الموافقة على صرف مبلغ وقدره (</span><span className="dotted-line"></span><span>) فقط للمذكور أعلاه.</span></div>
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>مقابل</span><span className="dotted-line"></span></div>
            <p style={{ margin: "5px 0" }}>ونتحمل كامل المسؤولية بالتواصل مع الطبيب المذكور للتأكد من استلام الخدمة.</p>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginTop: "10px" }}>
              <div>المكتب العلمي (الاسم): <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "100px" }}></span></div>
              <div>التوقيع: <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "100px" }}></span></div>
            </div>
          </div>
          <div className="box">
            <h4 style={{ fontWeight: "bold", margin: "0 0 5px 0", textDecoration: "underline" }}>الموافقة النهائية</h4>
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>يعتمد ويقيد على حساب شركة /</span><span className="dotted-line"></span></div>
            <div style={{ fontWeight: "bold", margin: "6px 0" }}>علماً بأن آخر دعم للمذكور كان بتاريخ &nbsp;&nbsp; / &nbsp;&nbsp; / 202&nbsp; م.</div>
            <div style={{ fontWeight: "bold" }}>مدير القطاع: <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "150px" }}></span></div>
          </div>
          <div className="box">
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>الأخ أمين الصندوق لفرع</span><span className="dotted-line"></span><span>المحترم،</span></div>
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>لا مانع من صرف (</span><span className="dotted-line"></span><span>) للأخ د.</span><span className="dotted-line"></span></div>
            <div className="flex-row" style={{ fontWeight: "bold" }}><span>ويقيد على حساب شركة (</span><span className="dotted-line"></span><span>)</span></div>
            <div style={{ display: "flex", justifyContent: "space-around", fontWeight: "bold", marginTop: "10px" }}>
              <div>المدير العام: <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "100px" }}></span></div>
              <div>مدير المبيعات: <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "100px" }}></span></div>
            </div>
          </div>
          <div className="box box-receipt">
            <p style={{ margin: "0 0 6px 0", fontWeight: "bold", textAlign: "center" }}>استلمت المبلغ لدعم الطبيب المذكور أعلاه ونلتزم بكتابة الأصناف ونتحمل المسؤولية كاملة.</p>
            <div style={{ display: "flex", justifyContent: "space-around", fontWeight: "bold" }}>
              <div>الاسم: <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "120px" }}></span></div>
              <div>التوقيع: <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "120px" }}></span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSupportForm;
