import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUsers, addUser, updateUser, deleteUser, type User, type UserRole } from "@/lib/supabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Pencil, Users, Shield, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const roleLabels: Record<UserRole, string> = {
  admin: "مدير النظام",
  "branch-manager": "مدير فرع",
  representative: "مندوب",
};

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ username: "", password: "", displayName: "", role: "representative" as UserRole });

  const reload = async () => {
    setLoading(true);
    const list = await getUsers();
    setUsers(list);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const handleAdd = async () => {
    if (!form.username.trim() || !form.password.trim()) {
      toast({ title: "خطأ", description: "يجب ملء جميع الحقول", variant: "destructive" });
      return;
    }
    setLoading(true);
    const newUser = await addUser({
      username: form.username,
      password: form.password,
      displayName: form.displayName || form.username,
      role: form.role,
    });
    setLoading(false);
    if (newUser) {
      toast({ title: "تم الإضافة", description: "تم إضافة المستخدم بنجاح" });
      setForm({ username: "", password: "", displayName: "", role: "representative" });
      setShowAdd(false);
      reload();
    } else {
      toast({ title: "خطأ", description: "فشل في إضافة المستخدم. قد يكون اسم المستخدم مستخدماً بالفعل.", variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    setLoading(true);
    await updateUser(editUser.id, {
      username: form.username,
      displayName: form.displayName || form.username,
      role: form.role,
    });
    setLoading(false);
    toast({ title: "تم التعديل", description: "تم تعديل المستخدم بنجاح" });
    setEditUser(null);
    reload();
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    await deleteUser(id);
    setLoading(false);
    toast({ title: "تم الحذف", description: "تم حذف المستخدم" });
    reload();
  };

  const startEdit = (user: User) => {
    setEditUser(user);
    setForm({ username: user.username, password: "", displayName: user.displayName, role: user.role });
  };

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Users className="h-6 w-6" /> إدارة المستخدمين
        </h1>
        <Button onClick={() => { setShowAdd(true); setForm({ username: "", password: "", displayName: "", role: "representative" }); }} className="gap-2">
          <Plus className="h-4 w-4" /> إضافة مستخدم
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      <div className="grid gap-4">
        {users.map(user => (
          <div key={user.id} className="bg-card rounded-lg shadow-sm border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-bold text-card-foreground">{user.displayName}</div>
                <div className="text-sm text-muted-foreground">
                  {roleLabels[user.role]} • @{user.username}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => startEdit(user)}>
                <Pencil className="h-4 w-4 text-primary" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {!loading && users.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            لا يوجد مستخدمون. أضف مستخدماً جديداً.
          </div>
        )}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>إضافة مستخدم جديد</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label>اسم المستخدم</Label><Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} /></div>
            <div><Label>كلمة المرور</Label><Input type="password" dir="ltr" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></div>
            <div><Label>الاسم الظاهر</Label><Input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} /></div>
            <div>
              <Label>الصلاحية</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as UserRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير النظام</SelectItem>
                  <SelectItem value="branch-manager">مدير فرع</SelectItem>
                  <SelectItem value="representative">مندوب</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              إضافة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader><DialogTitle>تعديل المستخدم</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div><Label>اسم المستخدم</Label><Input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} /></div>
            <div><Label>الاسم الظاهر</Label><Input value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} /></div>
            <div>
              <Label>الصلاحية</Label>
              <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as UserRole }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير النظام</SelectItem>
                  <SelectItem value="branch-manager">مدير فرع</SelectItem>
                  <SelectItem value="representative">مندوب</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
              حفظ التعديلات
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
