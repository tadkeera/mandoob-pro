import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Index from "./pages/Index";
import DoctorSupportForm from "./pages/DoctorSupportForm";
import ConsignmentForm from "./pages/ConsignmentForm";
import ExtraBonusForm from "./pages/ExtraBonusForm";
import Reports from "./pages/Reports";
import ReportsIndex from "./pages/ReportsIndex";
import DataManagement from "./pages/DataManagement";
import SignaturePage from "./pages/SignaturePage";
import LoginPage from "./pages/LoginPage";
import UserManagement from "./pages/UserManagement";
import ManagerDashboard from "./pages/ManagerDashboard";
import RepRecordsPage from "./pages/RepRecordsPage";
import NotFound from "./pages/NotFound";
import { useAutoBackup } from "@/hooks/useAutoBackup";

const queryClient = new QueryClient();

const AppContent = () => {
  const { user } = useAuth();
  useAutoBackup();

  if (!user) {
    return <LoginPage />;
  }

  const isRep = user.role === 'representative';
  const isManager = user.role === 'branch-manager';

  if (isManager) {
    return (
      <>
        <Navbar />
        <Routes>
          <Route path="/" element={<ManagerDashboard />} />
          <Route path="/manager-dashboard" element={<ManagerDashboard />} />
          <Route path="/manager-dashboard/rep/:repId" element={<RepRecordsPage />} />
          <Route path="/signature" element={<SignaturePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    );
  }

  if (isRep) {
    return (
      <>
        <Navbar />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/doctor-support" element={<DoctorSupportForm />} />
          <Route path="/consignment" element={<ConsignmentForm />} />
          <Route path="/extra-bonus" element={<ExtraBonusForm />} />
          <Route path="/reports" element={<ReportsIndex />} />
          <Route path="/reports/:type" element={<Reports />} />
          <Route path="/signature" element={<SignaturePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    );
  }

  // Admin
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/doctor-support" element={<DoctorSupportForm />} />
        <Route path="/consignment" element={<ConsignmentForm />} />
        <Route path="/extra-bonus" element={<ExtraBonusForm />} />
        <Route path="/reports" element={<ReportsIndex />} />
        <Route path="/reports/:type" element={<Reports />} />
        <Route path="/signature" element={<SignaturePage />} />
        <Route path="/data-management" element={<DataManagement />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/manager-dashboard" element={<ManagerDashboard />} />
        <Route path="/manager-dashboard/rep/:repId" element={<RepRecordsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
