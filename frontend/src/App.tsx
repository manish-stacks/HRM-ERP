import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SelfServicePage } from './pages/SelfServicePage';
import { EmployeesPage } from './pages/EmployeesPage';
import { OrganizationPage } from './pages/OrganizationPage';
import { ShiftsPage } from './pages/ShiftsPage';
import { AttendancePage } from './pages/AttendancePage';
import { FaceAttendancePage } from './pages/FaceAttendancePage';
import { LeavePage } from './pages/LeavePage';
import { PayrollPage } from './pages/PayrollPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { RecruitmentPage } from './pages/RecruitmentPage';
import { PerformancePage } from './pages/PerformancePage';
import { TrainingPage } from './pages/TrainingPage';
import { AssetsPage } from './pages/AssetsPage';
import { HelpdeskPage } from './pages/HelpdeskPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-medium text-sm">
        Initializing Enterprise HRM Workspace...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/kiosk" element={<FaceAttendancePage isStandaloneKiosk={true} />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="self-service" element={<SelfServicePage />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="organization" element={<OrganizationPage />} />
            <Route path="shifts" element={<ShiftsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="face-attendance" element={<FaceAttendancePage />} />
            <Route path="leaves" element={<LeavePage />} />
            <Route path="payroll" element={<PayrollPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="recruitment" element={<RecruitmentPage />} />
            <Route path="performance" element={<PerformancePage />} />
            <Route path="training" element={<TrainingPage />} />
            <Route path="assets" element={<AssetsPage />} />
            <Route path="helpdesk" element={<HelpdeskPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

