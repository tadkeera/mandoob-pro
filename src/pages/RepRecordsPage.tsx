import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getUsers, type User, getManagerSignature } from "@/lib/auth";
import { getAll, updateRecordSignature, updateRecordStatus, type FormRecord } from "@/lib/db";
import { printElement } from "@/lib/pdfUtils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FormHeader from "@/components/FormHeader";
import { Eye, Printer, ArrowRight, Check } from "lucide-react";

const typeLabels: Record<string, string> = {
  "doctor-support": "استمارة دعم طبيب",
  "consignment": "نموذج تصريف",
  "extra-bonus": "نموذج بونص إضافي",
};

function getRecordName(record: FormRecord): string {
  const d = record.data;
  if (record.type === "doctor-support") return (d.doctor || d.doctorName || "") as string;
  if (record.type === "consignment") return (d.clientName || "") as string;
  if (record.type === "extra-bonus") return (d.subject || d.clientName || "") as string;
  return "";
}

function SignatureImg({ src, width = 90, height = 45 }: { src?: string | null; width?: number; height?: number }) {
  if (!src) return null;
  return <img src={src} alt="التوقيع" style={{ width: `${width}px`, height: `${height}px`, objectFit: "contain", display: "inline-block", verticalAlign: "middle" }} />;
}

function RecordContent({ record, showRepSig, showManagerSig, managerSigUrl }: {
  record: FormRecord; showRepSig: boolean; showManagerSig: boolean; managerSigUrl?: string
}) {
  const d = record.data;
  const repSig = record.repSignature;
  const mgrSig = managerSigUrl || record.managerSignature;

  if (record.type === "doctor-support") {
    const pharmacies = (d.pharmacies as any[]) || [];
    return (
      <div style={{ fontSize: "13px", lineHeight: 1.4 }}>
        <h1 style={{ fontSize: "16px", fontWeight: "bold", textAlign: "center", margin: "5px 0 10px" }}>استمارة دعم طبيب</h1>
        <div style={{ fontWeight: "bold", marginBottom: "10px" }}>التاريخ: <span className="out-text">{d.date as string}</span></div>
        <div className="flex-row">
          <span style={{ whiteSpace: "nowrap" }}>الأخ مشرف شركة:</span>
          <span className="dotted-line out-text">{d.supervisor as string}</span>
          <span style={{ whiteSpace: "nowrap" }}>المحترم، بعد التحية،</span>
        </div>
        <div className="flex-row">
          <span style={{ whiteSpace: "nowrap" }}>نرجو منكم الموافقة على صرف مبلغ وقدره (</span>
          <span className="dotted-line out-text">{d.amount as string}</span>
          <span style={{ whiteSpace: "nowrap" }}>) فقط.</span>
        </div>
        <div className="flex-row">
          <div style={{ flexBasis: "55%", display: "flex", alignItems: "baseline" }}>
            <span style={{ whiteSpace: "nowrap" }}>للأخ الدكتور:</span>
            <span className="dotted-line out-text">{d.doctor as string || d.doctorName as string}</span>
          </div>
          <div style={{ flexBasis: "42%", display: "flex", alignItems: "baseline" }}>
            <span style={{ whiteSpace: "nowrap" }}>أخصائي:</span>
            <span className="dotted-line out-text">{d.specialty as string}</span>
          </div>
        </div>
        <div className="flex-row">
          <div style={{ flexBasis: "48%", display: "flex", alignItems: "baseline" }}>
            <span style={{ whiteSpace: "nowrap" }}>يعمل صباحاً في:</span>
            <span className="dotted-line out-text">{d.morning as string}</span>
          </div>
          <div style={{ flexBasis: "48%", display: "flex", alignItems: "baseline" }}>
            <span style={{ whiteSpace: "nowrap" }}>ومساءً في:</span>
            <span className="dotted-line out-text">{d.evening as string}</span>
          </div>
        </div>
        <div className="flex-row">
          <div style={{ flexBasis: "48%", display: "flex", alignItems: "baseline" }}>
            <span style={{ whiteSpace: "nowrap" }}>تلفون ثابت:</span>
            <span className="dotted-line out-text">{d.landline as string}</span>
          </div>
          <div style={{ flexBasis: "48%", display: "flex", alignItems: "baseline" }}>
            <span style={{ whiteSpace: "nowrap" }}>تلفون سيار:</span>
            <span className="dotted-line out-text">{d.mobile as string}</span>
          </div>
        </div>
        <div className="flex-row">
          <span style={{ whiteSpace: "nowrap" }}>مقابل / </span>
          <span className="dotted-line out-text">{d.purpose as string}</span>
        </div>
        <div className="flex-row">
          <span style={{ whiteSpace: "nowrap" }}>لكتابة الأصناف التالية: </span>
          <span className="dotted-line out-text">{d.items as string}</span>
        </div>
        <div style={{ marginTop: "5px" }}>
          <span style={{ fontWeight: "bold" }}>والصيدليات المجاورة للمذكور:</span>
          <table className="compact-table">
            <thead><tr><th style={{ width: "40%" }}>اسم الصيدلية</th><th style={{ width: "30%" }}>رقم الهاتف</th><th style={{ width: "30%" }}>قيمة المشتريات</th></tr></thead>
            <tbody>{pharmacies.map((p: any, i: number) => <tr key={i}><td>{p.name}</td><td dir="ltr">{p.phone}</td><td>{p.amount}</td></tr>)}</tbody>
          </table>
        </div>
        <p style={{ margin: "5px 0 10px 0", fontSize: "12px", textAlign: "center", fontWeight: "bold" }}>
          وعليه نلتزم بوفاء المذكور بكتابة الأصناف، وفي حالة عدم الوفاء فنحن نتحمل المسؤولية كاملة.
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px", alignItems: "center", marginTop: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            مقدم الطلب: <span className="out-text">{d.rep as string}</span>
            {showRepSig && <SignatureImg src={repSig} />}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            مدير الفرع:
            {showManagerSig && mgrSig ? <SignatureImg src={mgrSig} /> : <span style={{ display: "inline-block", borderBottom: "1px dotted #000", minWidth: "120px" }}></span>}
          </div>
        </div>
        {/* Bottom section boxes */}
        <div style={{ fontSize: "12px", marginTop: "8px" }}>
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
          <div className="box" style={{ backgroundColor: "#f9f9f9", border: "2px solid #000" }}>
            <p style={{ margin: "0 0 6px 0", fontWeight: "bold", textAlign: "center" }}>استلمت المبلغ لدعم الطبيب المذكور أعلاه ونلتزم بكتابة الأصناف ونتحمل المسؤولية كاملة.</p>
            <div style={{ display: "flex", justifyContent: "space-around", fontWeight: "bold" }}>
              <div>الاسم: <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "120px" }}></span></div>
              <div>التوقيع: <span style={{ display: "inline-block", borderBottom: "1px dotted #000", width: "120px" }}></span></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (record.type === "extra-bonus") {
    const items = (d.items as any[]) || [];
    return (
      <div style={{ fontSize: "13px", lineHeight: 1.5 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontWeight: "bold" }}>
          <div>التاريخ: <span className="out-text">{d.date as string}</span></div>
          <div>الفرع: <span className="out-text">{d.branch as string}</span></div>
        </div>
        <div style={{ fontWeight: "bold", marginBottom: "5px" }}>الأخ/ <span className="out-text">{d.recipient as string}</span></div>
        <div style={{ textAlign: "left", fontWeight: "bold", marginBottom: "5px" }}>المحترم</div>
        <p style={{ textAlign: "center" }}>بعد التحية ،،،،،</p>
        <div style={{ fontWeight: "bold", margin: "10px 0" }}>الموضوع: بونص اضافي او دعم <span className="out-text">{d.subject as string}</span></div>
        <p>بالإشارة الى الموضوع أعلاه نرجو تكرمكم بالموافقة على صرف البونص الإضافي للمذكور وذلك على النحو التالي :-</p>
        <table className="compact-table">
          <thead><tr><th>الرقم</th><th>اسم الصنف</th><th>الكمية المشتراة</th><th>نسبة البونص</th><th>كمية التعويض عدد</th></tr></thead>
          <tbody>{items.map((it: any, i: number) => <tr key={i}><td>{i+1}</td><td>{it.name}</td><td>{it.qty}</td><td>{it.bonusPercent}</td><td>{it.compensation}</td></tr>)}</tbody>
        </table>
        <div style={{ fontWeight: "bold", marginBottom: "15px", marginTop: "8px" }}>
          وذلك بفاتورة رقم: <span className="out-text">{d.invoice as string}</span> (<span className="out-text">{d.paymentType as string}</span>)
        </div>
        <p>وعليه .... التزم بتصريف البضاعة المباعة وعدم إرجاعها ونتحمل المسئولية كامله .</p>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", fontWeight: "bold", textAlign: "center", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            المندوب<br /><span className="out-text">{d.rep as string}</span>
            {showRepSig && <SignatureImg src={repSig} />}
          </div>
          <div>مدير الفرع<br />{showManagerSig && mgrSig ? <SignatureImg src={mgrSig} /> : <span>...................</span>}</div>
          <div>المكتب العلمي<br />...................</div>
          <div>مدير القطاع<br />...................</div>
        </div>
      </div>
    );
  }

  if (record.type === "consignment") {
    const clients = (d.clients as any[]) || [];
    return (
      <div style={{ fontSize: "13px", lineHeight: 1.5 }}>
        <div style={{ textAlign: "center", fontWeight: "bold", marginBottom: "10px" }}>بسم الله الرحمن الرحيم</div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", fontWeight: "bold" }}>
          <div>التاريخ: <span className="out-text">{d.date as string}</span></div>
          <div>الفرع: <span className="out-text">{d.branch as string}</span></div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", marginBottom: "15px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}><span>الاخ / مدير القطاع</span><span>الاخ / مدير المكتب العلمي</span></div>
          <div style={{ alignSelf: "flex-end" }}>المحترمين</div>
        </div>
        <p>بعد التحية ،،،،،،،،،،</p>
        <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px", margin: "15px 0", textDecoration: "underline" }}>الموضوع: إنزال بضاعة تحت التصريف</div>
        <p>اشارة الى الموضوع اعلاه ، نرجو منكم الموافقة على أنزال الاصناف التالية تحت التصريف وعلى مسئوليتي متابعتها أولاً بأول وعدم وجود أي منتهيات والاصناف هي :</p>
        {clients.map((client: any, cIdx: number) => (
          <div key={cIdx} style={{ marginBottom: "10px" }}>
            <div style={{ fontWeight: "bold", marginBottom: "5px" }}>العميل: <span className="out-text">{client.clientName}</span></div>
            <table className="compact-table">
              <thead><tr><th>اسم الصنف</th><th>الكمية</th><th>التاريخ</th></tr></thead>
              <tbody>{(client.items || []).map((item: any, i: number) => <tr key={i}><td>{item.name}</td><td>{item.qty}</td><td>{item.date}</td></tr>)}</tbody>
            </table>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "50px", fontWeight: "bold", textAlign: "center", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            المندوب<br /><span className="out-text">{d.rep as string}</span>
            {showRepSig && <SignatureImg src={repSig} />}
          </div>
          <div>مدير الفرع<br />{showManagerSig && mgrSig ? <SignatureImg src={mgrSig} /> : <span>...................</span>}</div>
          <div>المكتب العلمي<br />...................</div>
          <div>مدير القطاع<br />...................</div>
        </div>
      </div>
    );
  }
  return null;
}

const RepRecordsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { repId } = useParams<{ repId: string }>();
  const [rep, setRep] = useState<User | null>(null);
  const [repForms, setRepForms] = useState<FormRecord[]>([]);
  const [viewRecord, setViewRecord] = useState<FormRecord | null>(null);

  const loadData = () => {
    const users = getUsers();
    const foundRep = users.find(u => u.id === repId);
    setRep(foundRep || null);
    if (repId) {
      const allRecords = getAll();
      setRepForms(allRecords.filter(r => r.userId === repId && r.status === 'pending-approval'));
    }
  };

  useEffect(() => { loadData(); }, [repId]);

  const handleApprove = (record: FormRecord) => {
    if (!user) return;
    const sig = getManagerSignature(user.id);
    if (!sig) {
      toast({
        title: "لا يوجد توقيع",
        description: "يرجى إعداد توقيع مدير الفرع أولاً من لوحة التحكم ← إعدادات التوقيع",
        variant: "destructive"
      });
      return;
    }
    updateRecordSignature(record.id, 'managerSignature', sig);
    updateRecordStatus(record.id, 'approved');
    toast({ title: "✅ تم الاعتماد", description: `تم اعتماد النموذج وإضافة توقيع مدير الفرع بنجاح` });
    loadData();
  };

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <Link to="/manager-dashboard" className="flex items-center gap-2 text-primary hover:underline">
          <ArrowRight className="h-5 w-5" />
          <span className="font-medium">رجوع للوحة المدير</span>
        </Link>
        <h1 className="text-2xl font-bold text-primary">
          نماذج {rep?.displayName || "المندوب"} - بانتظار الاعتماد
        </h1>
      </div>

      {repForms.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">لا توجد نماذج بانتظار الاعتماد</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {repForms.map(record => (
            <div key={record.id} className="bg-card rounded-lg shadow-sm border p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-xs font-medium">
                    {typeLabels[record.type] || record.type}
                  </span>
                  <span className="font-bold text-sm">{getRecordName(record) || "بدون اسم"}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(record.createdAt).toLocaleDateString("ar-YE")}
                  </span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Button variant="ghost" size="sm" onClick={() => setViewRecord(record)} className="gap-1">
                    <Eye className="h-4 w-4" /> عرض
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprove(record)}
                    className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Check className="h-4 w-4" /> موافقة على الاعتماد
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => {
                    setViewRecord(record);
                    setTimeout(() => printElement("manager-record-print"), 800);
                  }} className="gap-1">
                    <Printer className="h-4 w-4" /> طباعة
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground border-t pt-2 space-y-1">
                <div>تاريخ الإرسال: {record.submittedForApprovalAt ? new Date(record.submittedForApprovalAt).toLocaleString("ar-YE") : new Date(record.createdAt).toLocaleString("ar-YE")}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewRecord ? typeLabels[viewRecord.type] : ""}</DialogTitle></DialogHeader>
          {viewRecord && (
            <div id="manager-record-print" className="print-page" style={{ border: "2px solid #000", borderRadius: "5px", padding: "16px" }}>
              <FormHeader />
              <RecordContent
                record={viewRecord}
                showRepSig={true}
                showManagerSig={!!viewRecord.managerSignature}
                managerSigUrl={viewRecord.managerSignature}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RepRecordsPage;
