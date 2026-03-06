import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getUsers, addUser, updateUser, deleteUser, type User, type UserRole } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Pencil, Users, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const roleLabels: Record<UserRole, string> = {
  admin: "مدير النظام",
  "branch-manager": "مدير فرع",
  representative: "مندوب",
};

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ username: "", password: "", displayName: "", role: "representative" as UserRole });

  const reload = () => setUsers(getUsers());
  useEffect(() => { reload(); }, []);

  const handleAdd = () => {
    if (!form.username.trim() || !form.password.trim()) {
      toast({ title: "خطأ", description: "يجب ملء جميع الحقول", variant: "destructive" });
      return;
    }
    addUser({ username: form.username, password: form.password, displayName: form.displayName || form.username, role: form.role });
    toast({ title: "تم الإضافة", description: "تم إضافة المستخدم بنجاح" });
    setForm({ username: "", password: "", displayName: "", role: "representative" });
    setShowAdd(false);
    reload();
  };

  const handleUpdate = () => {
    if (!editUser) return;
    updateUser(editUser.id, {
      username: form.username,
      password: form.password,
      displayName: form.displayName || form.username,
      role: form.role,
    });
    toast({ title: "تم التعديل", description: "تم تعديل المستخدم بنجاح" });
    setEditUser(null);
    reload();
  };

  const handleDelete = (id: string) => {
    if (id === 'admin-default') {
      toast({ title: "خطأ", description: "لا يمكن حذف المدير الافتراضي", variant: "destructive" });
      return;
    }
    deleteUser(id);
    toast({ title: "تم الحذف", description: "تم حذف المستخدم" });
    reload();
  };

  const startEdit = (user: User) => {
    setEditUser(user);
    setForm({ username: user.username, password: user.password, displayName: user.displayName, role: user.role });
  };

  return (
    <div className="container mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Users className="h-6 w-6" /> إدارة المستخدمين
        </h1>
        <Button onClick={() => { setShowAdd(true); setForm({ username: "", password: "", displayName: "", role: "representative" }); }} className="gap-2">
          <Plus className="h-4 w-4" /> إضافة مستخدم
        </Button>
      </div>

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
              {user.id !== 'admin-default' && (
                <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
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
            <Button onClick={handleAdd}>إضافة</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>تعديل المستخدم</DialogTitle></DialogHeader>
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
            <Button onClick={handleUpdate}>حفظ التعديلات</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
