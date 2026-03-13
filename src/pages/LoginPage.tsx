import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import companyLogo from "@/assets/company-logo.png";

const LoginPage = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      setError(true);
      return;
    }
    setLoading(true);
    const user = await login(username.trim(), password);
    setLoading(false);
    if (!user) {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" dir="rtl">
      <div className="bg-card rounded-xl shadow-xl border p-8 max-w-md w-full text-center">
        <div className="h-24 w-24 mx-auto mb-6 rounded-xl overflow-hidden flex items-center justify-center bg-primary/5">
          <img src={companyLogo} alt="شركة بلقيس" className="h-full w-full object-contain" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-1">مندوب برو</h1>
        <p className="text-sm text-muted-foreground mb-6">مستودعات أدوية بلقيس</p>
        <div className="space-y-4 text-right">
          <div>
            <Label>اسم المستخدم</Label>
            <Input
              value={username}
              onChange={e => { setUsername(e.target.value); setError(false); }}
              placeholder="اسم المستخدم"
              className="mt-1"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              disabled={loading}
            />
          </div>
          <div>
            <Label>كلمة المرور</Label>
            <Input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(false); }}
              placeholder="كلمة المرور"
              className="mt-1"
              dir="ltr"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              disabled={loading}
            />
          </div>
          {error && (
            <p className="text-destructive text-sm">اسم المستخدم أو كلمة المرور غير صحيحة</p>
          )}
          <Button onClick={handleLogin} className="w-full mt-2" disabled={loading}>
            {loading ? "جاري التحقق..." : "دخول"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
