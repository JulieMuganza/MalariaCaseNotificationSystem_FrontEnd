import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { CasesProvider } from './context/CasesContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RootRedirect } from './pages/auth/RootRedirect';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { GoogleCallbackPage } from './pages/auth/GoogleCallbackPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { OTPPage } from './pages/auth/OTPPage';
import { SetupPasswordPage } from './pages/auth/SetupPasswordPage';
import { RoleSelector } from './pages/RoleSelector';
import { CHWLayout } from './pages/chw/CHWLayout';
import { CHWHome } from './pages/chw/CHWHome';
import { CHWNewCase } from './pages/chw/CHWNewCase';
import { CHWCases } from './pages/chw/CHWCases';
import { CHWPatients } from './pages/chw/CHWPatients';
import { CHWReports } from './pages/chw/CHWReports';
import { CHWCaseDetail } from './pages/chw/CHWCaseDetail';
import { CHWNotifications } from './pages/chw/CHWNotifications';
import { CHWMessagesPage } from './pages/chw/CHWMessagesPage';
import { CHWSettingsPage } from './pages/chw/CHWSettingsPage';
import { HCLayout } from './pages/hc/HCLayout';
import { HCDashboard } from './pages/hc/HCDashboard';
import { HCCaseManagement } from './pages/hc/HCCaseManagement';
import { HCCaseHistory } from './pages/hc/HCCaseHistory';
import { HCTriageQueue } from './pages/hc/HCTriageQueue';
import { HCProfile } from './pages/hc/HCProfile';
import { HCNotificationsPage } from './pages/hc/HCNotificationsPage';
import { HCMessagesPage } from './pages/hc/HCMessagesPage';
import { HCReports } from './pages/hc/HCReports';
import { HCNewCase } from './pages/hc/HCNewCase';
import { HCPatients } from './pages/hc/HCPatients';
import { HCPatientJourney } from './pages/hc/HCPatientJourney';
import { HospitalLayout } from './pages/hospital/HospitalLayout';
import { HospitalDashboard } from './pages/hospital/HospitalDashboard';
import { HospitalCaseView } from './pages/hospital/HospitalCaseView';
import { HospitalChecklist } from './pages/hospital/HospitalChecklist';
import { HospitalOutcome } from './pages/hospital/HospitalOutcome';
import { HospitalReports } from './pages/hospital/HospitalReports';
import { HospitalNotificationsPage } from './pages/hospital/HospitalNotificationsPage';
import { HospitalMessagesPage } from './pages/hospital/HospitalMessagesPage';
import { HospitalProfile } from './pages/hospital/HospitalProfile';
import { HospitalCasesPage } from './pages/hospital/HospitalCasesPage';
import { HospitalClinicalManagement } from './pages/hospital/HospitalClinicalManagement';
import { HospitalPatients } from './pages/hospital/HospitalPatients';
import { HospitalPatientJourney } from './pages/hospital/HospitalPatientJourney';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminMap } from './pages/admin/AdminMap';
import { AdminRiskFactors } from './pages/admin/AdminRiskFactors';
import { AdminNotificationModel } from './pages/admin/AdminNotificationModel';
import { AdminTimeline } from './pages/admin/AdminTimeline';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminExport } from './pages/admin/AdminExport';
import { RichLayout } from './pages/rich/RichLayout';
import { RichDashboard } from './pages/rich/RichDashboard';
import { RichMapPage } from './pages/rich/RichMapPage';
import { RichCasesPage } from './pages/rich/RichCasesPage';
import { RichPatients } from './pages/rich/RichPatients';
import { RichPatientJourney } from './pages/rich/RichPatientJourney';
import { RichNotificationsPage } from './pages/rich/RichNotificationsPage';
import { RichMessagesPage } from './pages/rich/RichMessagesPage';
import { RichReportsPage } from './pages/rich/RichReportsPage';
import { RichProfile } from './pages/rich/RichProfile';

export function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AppProvider>
        <AuthProvider>
          <CasesProvider>
          <Toaster position="top-right" richColors closeButton />
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/role-selector" element={<RoleSelector />} />

            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/otp" element={<OTPPage />} />
            <Route path="/account/setup-password" element={<SetupPasswordPage />} />

            <Route
              path="/chw"
              element={
                <ProtectedRoute allowedRoles={['CHW']}>
                  <CHWLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<CHWHome />} />
              <Route path="new-case" element={<CHWNewCase />} />
              <Route path="cases" element={<CHWCases />} />
              <Route path="patients" element={<CHWPatients />} />
              <Route path="reports" element={<CHWReports />} />
              <Route path="cases/:id" element={<CHWCaseDetail />} />
              <Route path="notifications" element={<CHWNotifications />} />
              <Route path="messages" element={<CHWMessagesPage />} />
              <Route path="settings" element={<CHWSettingsPage />} />
            </Route>

            <Route
              path="/hc"
              element={
                <ProtectedRoute allowedRoles={['Health Center']}>
                  <HCLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HCDashboard />} />
              <Route path="case/:id" element={<HCCaseManagement />} />
              <Route path="triage" element={<HCTriageQueue />} />
              <Route path="profile" element={<HCProfile />} />
              <Route path="notifications" element={<HCNotificationsPage />} />
              <Route path="messages" element={<HCMessagesPage />} />
              <Route path="reports" element={<HCReports />} />
              <Route path="history" element={<HCCaseHistory />} />
              <Route path="new-case" element={<HCNewCase />} />
              <Route path="patients" element={<HCPatients />} />
              <Route path="patients/:patientCode" element={<HCPatientJourney />} />
            </Route>

            <Route
              path="/lc"
              element={
                <ProtectedRoute allowedRoles={['Local Clinic']}>
                  <HCLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HCDashboard />} />
              <Route path="case/:id" element={<HCCaseManagement />} />
              <Route path="triage" element={<HCTriageQueue />} />
              <Route path="profile" element={<HCProfile />} />
              <Route path="notifications" element={<HCNotificationsPage />} />
              <Route path="messages" element={<HCMessagesPage />} />
              <Route path="reports" element={<HCReports />} />
              <Route path="history" element={<HCCaseHistory />} />
              <Route path="new-case" element={<HCNewCase />} />
              <Route path="patients" element={<HCPatients />} />
              <Route path="patients/:patientCode" element={<HCPatientJourney />} />
            </Route>

            <Route
              path="/hospital"
              element={
                <ProtectedRoute allowedRoles={['District Hospital']}>
                  <HospitalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HospitalDashboard />} />
              <Route path="cases" element={<HospitalCasesPage />} />
              <Route
                path="triage"
                element={<HospitalClinicalManagement />}
              />
              <Route path="patients" element={<HospitalPatients />} />
              <Route
                path="patients/:patientCode"
                element={<HospitalPatientJourney />}
              />
              <Route path="case/:id" element={<HospitalCaseView />} />
              <Route path="checklist/:id" element={<HospitalChecklist />} />
              <Route path="outcome/:id" element={<HospitalOutcome />} />
              <Route path="reports" element={<HospitalReports />} />
              <Route path="notifications" element={<HospitalNotificationsPage />} />
              <Route path="messages" element={<HospitalMessagesPage />} />
              <Route path="profile" element={<HospitalProfile />} />
            </Route>

            <Route
              path="/referral-hospital"
              element={
                <ProtectedRoute allowedRoles={['Referral Hospital']}>
                  <HospitalLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<HospitalDashboard />} />
              <Route
                path="triage"
                element={<HospitalClinicalManagement />}
              />
              <Route path="cases" element={<HospitalCasesPage />} />
              <Route path="patients" element={<HospitalPatients />} />
              <Route
                path="patients/:patientCode"
                element={<HospitalPatientJourney />}
              />
              <Route path="case/:id" element={<HospitalCaseView />} />
              <Route path="checklist/:id" element={<HospitalChecklist />} />
              <Route path="outcome/:id" element={<HospitalOutcome />} />
              <Route path="reports" element={<HospitalReports />} />
              <Route path="notifications" element={<HospitalNotificationsPage />} />
              <Route path="messages" element={<HospitalMessagesPage />} />
              <Route path="profile" element={<HospitalProfile />} />
            </Route>

            <Route
              path="/rich"
              element={
                <ProtectedRoute allowedRoles={['RICH']}>
                  <RichLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RichDashboard />} />
              <Route path="cases" element={<RichCasesPage />} />
              <Route path="patients" element={<RichPatients />} />
              <Route
                path="patients/:patientCode"
                element={<RichPatientJourney />}
              />
              <Route path="case/:id" element={<HospitalCaseView />} />
              <Route path="notifications" element={<RichNotificationsPage />} />
              <Route path="messages" element={<RichMessagesPage />} />
              <Route path="reports" element={<RichReportsPage />} />
              <Route path="map" element={<RichMapPage />} />
              <Route path="profile" element={<RichProfile />} />
            </Route>

            <Route
              path="/pfth"
              element={
                <ProtectedRoute allowedRoles={['PFTH']}>
                  <RichLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RichDashboard />} />
              <Route path="cases" element={<RichCasesPage />} />
              <Route path="patients" element={<RichPatients />} />
              <Route
                path="patients/:patientCode"
                element={<RichPatientJourney />}
              />
              <Route path="case/:id" element={<HospitalCaseView />} />
              <Route path="notifications" element={<RichNotificationsPage />} />
              <Route path="messages" element={<RichMessagesPage />} />
              <Route path="reports" element={<RichReportsPage />} />
              <Route path="map" element={<RichMapPage />} />
              <Route path="profile" element={<RichProfile />} />
            </Route>

            <Route
              path="/sfr"
              element={
                <ProtectedRoute allowedRoles={['SFR']}>
                  <RichLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<RichDashboard />} />
              <Route path="cases" element={<RichCasesPage />} />
              <Route path="patients" element={<RichPatients />} />
              <Route
                path="patients/:patientCode"
                element={<RichPatientJourney />}
              />
              <Route path="case/:id" element={<HospitalCaseView />} />
              <Route path="notifications" element={<RichNotificationsPage />} />
              <Route path="messages" element={<RichMessagesPage />} />
              <Route path="reports" element={<RichReportsPage />} />
              <Route path="map" element={<RichMapPage />} />
              <Route path="profile" element={<RichProfile />} />
            </Route>

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="map" element={<AdminMap />} />
              <Route path="risk-factors" element={<AdminRiskFactors />} />
              <Route path="notification-model" element={<AdminNotificationModel />} />
              <Route path="timeline" element={<AdminTimeline />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="export" element={<AdminExport />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </CasesProvider>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
