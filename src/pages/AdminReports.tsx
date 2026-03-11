import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, type User } from "@/lib/auth";
import { getAll, deleteRecord, type FormRecord } from "@/lib/db";
import { printElement } from "@/lib/pdfUtils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import FormHeader from "@/components/FormHeader";
import {
  Eye,
  Printer,
  Trash2,
  Users,
  FileText,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────

const typeLabels: Record<string, string> = {
  "doctor-support": "استمارة دعم طبيب",
  consignment: "نموذج تصريف",
  "extra-bonus": "نموذج بونص إضافي",
};

const statusLabels: Record<string, string> = {
  draft: "مسودة",
  "pending-approval": "بانتظار الاعتماد",
  approved: "معتمد ✅",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  "pending-approval": "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
};

function getRecordName(record: FormRecord): string {
  const d = record.data;
  if (record.type === "doctor-support") return (d.doctor || d.doctorName || "") as string;
  if (record.type === "consignment") return (d.clientName || "") as string;
  if (record.type === "extra-bonus") return (d.subject || d.clientName || "") as string;
  return "";
}

// ─── Signature helper ─────────────────────────────────────────────────────────

function SigImg({ src }: { src?: string | null }) {
  if (!src) return <span style={{ display: "inline-block", borderBottom: "1px dotted #000", minWidth: "110px" }} />;
  return (
    <img
      src={src}
      alt="التوقيع"
      style={{ width: "100px", height: "48px", objectFit: "contain", display: "inline-block", verticalAlign: "middle" }}
    />
  );
}

// ─── Form content renderer ────────────────────────────────────────────────────

function RecordContent({ record, managerNameMap }: { record: FormRecord; managerNameMap?: Record<string, string> }) {
  const d = record.data;
  // Get manager name from the record's approvedBy field or from the managerNameMap
  const managerName = (record as any).approvedByName || 
    (managerNameMap && record.userId ? managerNameMap[record.userId] : null);

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
            <span className="dotted-line out-text">{(d.doctor || d.doctorName) as string}</span>
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
            <tbody>
              {pharmacies.length === 0
                ? <tr><td colSpan={3} style={{ color: "#777" }}>لم يتم إضافة صيدليات</td></tr>
                : pharmacies.map((p: any, i: number) => <tr key={i}><td>{p.name}</td><td dir="ltr">{p.phone}</td><td>{p.amount}</td></tr>)
              }
            </tbody>
          </table>
        </div>
        <p style={{ margin: "5px 0 10px 0", fontSize: "12px", textAlign: "center", fontWeight: "bold" }}>
          وعليه نلتزم بوفاء المذكور بكتابة الأصناف، وفي حالة عدم الوفاء فنحن نتحمل المسؤولية كاملة.
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: "13px", alignItems: "center", marginTop: "10px" }}>
          <div>مقدم الطلب: <span className="out-text">{d.rep as string}</span></div>
          <div>
            مدير الفرع:{" "}
            {managerName
              ? <span className="out-text" style={{ fontWeight: "bold" }}>{managerName}</span>
              : <span style={{ display: "inline-block", borderBottom: "1px dotted #000", minWidth: "110px" }} />
            }
          </div>
        </div>
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
          <tbody>
            {items.length === 0
              ? <tr><td colSpan={5} style={{ color: "#777" }}>لم يتم إضافة أصناف</td></tr>
              : items.map((it: any, i: number) => <tr key={i}><td>{i + 1}</td><td>{it.name}</td><td>{it.qty}</td><td>{it.bonusPercent}</td><td>{it.compensation}</td></tr>)
            }
          </tbody>
        </table>
        <div style={{ fontWeight: "bold", marginBottom: "15px", marginTop: "8px" }}>
          وذلك بفاتورة رقم: <span className="out-text">{d.invoice as string}</span> (<span className="out-text">{d.paymentType as string}</span>)
        </div>
        <p>وعليه .... التزم بتصريف البضاعة المباعة وعدم إرجاعها ونتحمل المسئولية كامله .</p>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "30px", fontWeight: "bold", textAlign: "center", alignItems: "center" }}>
          <div>المندوب<br /><span className="out-text">{d.rep as string}</span></div>
          <div>
            مدير الفرع<br />
            {managerName ? <span className="out-text" style={{ fontWeight: "bold" }}>{managerName}</span> : <span>...................</span>}
          </div>
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
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span>الاخ / مدير القطاع</span>
            <span>الاخ / مدير المكتب العلمي</span>
          </div>
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
              <tbody>
                {(!client.items || client.items.length === 0)
                  ? <tr><td colSpan={3} style={{ color: "#777" }}>لم يتم إضافة أصناف</td></tr>
                  : client.items.map((item: any, i: number) => <tr key={i}><td>{item.name}</td><td>{item.qty}</td><td>{item.date}</td></tr>)
                }
              </tbody>
            </table>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "50px", fontWeight: "bold", textAlign: "center", alignItems: "center" }}>
          <div>المندوب<br /><span className="out-text">{d.rep as string}</span></div>
          <div>
            مدير الفرع<br />
            {managerName ? <span className="out-text" style={{ fontWeight: "bold" }}>{managerName}</span> : <span>...................</span>}
          </div>
          <div>المكتب العلمي<br />...................</div>
          <div>مدير القطاع<br />...................</div>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Rep section ──────────────────────────────────────────────────────────────

type FilterStatus = "all" | "draft" | "pending-approval" | "approved";

interface RepSectionProps {
  rep: User;
  records: FormRecord[];
  onDelete: (id: string) => void;
  onView: (record: FormRecord) => void;
  onPrint: (record: FormRecord) => void;
}

const RepSection = ({ rep, records, onDelete, onView, onPrint }: RepSectionProps) => {
  const [expanded, setExpanded] = useState(true);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = records.filter((r) => {
    const statusOk = filterStatus === "all" || r.status === filterStatus;
    const typeOk = filterType === "all" || r.type === filterType;
    return statusOk && typeOk;
  });

  const approvedCount = records.filter((r) => r.status === "approved").length;
  const pendingCount = records.filter((r) => r.status === "pending-approval").length;

  return (
    <div className="border rounded-xl overflow-hidden shadow-sm mb-6">
      {/* Rep header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 transition-colors text-right"
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-full p-2">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="text-right">
            <h3 className="font-bold text-foreground text-base">{rep.displayName}</h3>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground">{records.length} نموذج إجمالي</span>
              {approvedCount > 0 && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">{approvedCount} معتمد</span>
              )}
              {pendingCount > 0 && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">{pendingCount} بانتظار الاعتماد</span>
              )}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="p-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Filter className="h-3 w-3" /> تصفية:
            </div>
            {/* Status filter */}
            {(["all", "draft", "pending-approval", "approved"] as FilterStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  filterStatus === s
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary"
                }`}
              >
                {s === "all" ? "الكل" : statusLabels[s]}
              </button>
            ))}
            <span className="text-muted-foreground text-xs self-center">|</span>
            {/* Type filter */}
            {["all", "doctor-support", "consignment", "extra-bonus"].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  filterType === t
                    ? "bg-secondary text-secondary-foreground border-secondary"
                    : "bg-background text-muted-foreground border-border hover:border-secondary"
                }`}
              >
                {t === "all" ? "كل الأنواع" : typeLabels[t]}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">لا توجد نماذج مطابقة للتصفية</p>
          ) : (
            <div className="space-y-3">
              {filtered.map((record) => (
                <div key={record.id} className="border rounded-lg p-3 bg-card hover:shadow-sm transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Info */}
                    <div className="flex flex-wrap items-center gap-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full text-xs font-medium">
                        {typeLabels[record.type]}
                      </span>
                      <span className="font-semibold text-sm">{getRecordName(record) || "بدون اسم"}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[record.status || "draft"]}`}>
                        {statusLabels[record.status || "draft"]}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(record.createdAt).toLocaleDateString("ar-YE")}
                      </span>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => onView(record)} className="gap-1 text-xs h-8">
                        <Eye className="h-3.5 w-3.5" /> عرض
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onPrint(record)} className="gap-1 text-xs h-8">
                        <Printer className="h-3.5 w-3.5" /> طباعة
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(record.id)}
                        className="gap-1 text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> حذف
                      </Button>
                    </div>
                  </div>
                  {/* Dates row */}
                  <div className="mt-2 pt-2 border-t text-xs text-muted-foreground flex flex-wrap gap-4">
                    {record.submittedForApprovalAt && (
                      <span>تاريخ الإرسال: {new Date(record.submittedForApprovalAt).toLocaleString("ar-YE")}</span>
                    )}
                    {record.approvedAt && (
                      <span className="text-green-700">تاريخ الاعتماد: {new Date(record.approvedAt).toLocaleString("ar-YE")}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────

const AdminReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [reps, setReps] = useState<User[]>([]);
  const [recordsMap, setRecordsMap] = useState<Record<string, FormRecord[]>>({});
  const [viewRecord, setViewRecord] = useState<FormRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [globalFilter, setGlobalFilter] = useState<FilterStatus>("all");

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== "admin") navigate("/");
  }, [user]);

  const loadData = () => {
    const users = getUsers();
    const repUsers = users.filter((u) => u.role === "representative");
    const all = getAll();
    const map: Record<string, FormRecord[]> = {};
    repUsers.forEach((rep) => {
      let repRecords = all.filter((r) => r.userId === rep.id);
      if (globalFilter !== "all") {
        repRecords = repRecords.filter((r) => r.status === globalFilter);
      }
      map[rep.id] = repRecords.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
    setReps(repUsers);
    setRecordsMap(map);
  };

  useEffect(() => { loadData(); }, [globalFilter]);

  const handleDelete = (id: string) => setDeleteId(id);

  const confirmDelete = () => {
    if (!deleteId) return;
    deleteRecord(deleteId);
    setDeleteId(null);
    toast({ title: "تم الحذف", description: "تم حذف النموذج بنجاح" });
    loadData();
  };

  const handleView = (record: FormRecord) => setViewRecord(record);

  const handlePrint = (record: FormRecord) => {
    setViewRecord(record);
    setTimeout(() => {
      printElement("admin-record-print");
    }, 700);
  };

  const totalRecords = Object.values(recordsMap).reduce((s, arr) => s + arr.length, 0);
  const totalApproved = Object.values(recordsMap).flat().filter((r) => r.status === "approved").length;

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary mb-1">تقارير النماذج - مدير النظام</h1>
        <p className="text-sm text-muted-foreground">عرض جميع نماذج المندوبين مع إمكانية الطباعة والحذف</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "إجمالي المندوبين", value: reps.length, color: "text-primary" },
          { label: "إجمالي النماذج", value: totalRecords, color: "text-foreground" },
          { label: "النماذج المعتمدة", value: totalApproved, color: "text-green-600" },
          {
            label: "بانتظار الاعتماد",
            value: Object.values(recordsMap).flat().filter((r) => r.status === "pending-approval").length,
            color: "text-yellow-600",
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border rounded-xl p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Global filter */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <span className="text-sm font-medium text-muted-foreground">عرض:</span>
        {(["all", "approved", "pending-approval", "draft"] as FilterStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setGlobalFilter(s)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors font-medium ${
              globalFilter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary"
            }`}
          >
            {s === "all" ? "جميع النماذج" : statusLabels[s]}
          </button>
        ))}
      </div>

      {/* Reps list */}
      {reps.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>لا يوجد مندوبون مسجّلون</p>
        </div>
      ) : (
        reps.map((rep) => (
          <RepSection
            key={rep.id}
            rep={rep}
            records={recordsMap[rep.id] || []}
            onDelete={handleDelete}
            onView={handleView}
            onPrint={handlePrint}
          />
        ))
      )}

      {/* View Dialog */}
      <Dialog open={!!viewRecord} onOpenChange={() => setViewRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewRecord ? typeLabels[viewRecord.type] : ""}</DialogTitle>
          </DialogHeader>
          {viewRecord && (
            <div
              id="admin-record-print"
              className="print-page"
              style={{ border: "2px solid #000", borderRadius: "5px", padding: "16px" }}
            >
              <FormHeader />
              <RecordContent record={viewRecord} />
            </div>
          )}
          <div className="flex justify-end gap-2 mt-4 no-print">
            <Button
              onClick={() => viewRecord && handlePrint(viewRecord)}
              className="gap-2"
            >
              <Printer className="h-4 w-4" /> طباعة
            </Button>
            <Button
              variant="destructive"
              onClick={() => { viewRecord && handleDelete(viewRecord.id); setViewRecord(null); }}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" /> حذف النموذج
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا النموذج؟ لا يمكن التراجع عن هذه العملية.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminReports;
