import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store} from './redux/store';
import { useAppSelector } from './hooks/hooks';
import LoginPage from './features/auth/pages/Loginpage';
import VerifyOtpPage from './features/auth/pages/Verifyotppage';
import ResetPasswordPage from './features/auth/pages/Resetpasswordpage';
import RecruiterDashboard from './features/recruiter_dashboard/pages/Recruiterdashboard';
import AdminDashboard from './features/admin/pages/Admindashboard';
import JobDetailPage from './features/job_post/pages/Jobdetailpage';

type Screen = 'login' | 'verify-otp' | 'reset-password';

const AppInner: React.FC = () => {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [screen, setScreen] = useState<Screen>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [verifiedOtp, setVerifiedOtp] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  if (isAuthenticated) {
    if (selectedJobId) {
      return (
        <JobDetailPage
          jobId={selectedJobId}
          onBack={() => setSelectedJobId(null)}
        />
      );
    }
    
    // Check role_id from decoded token
    const roleId : number | string | undefined = user?.role_id;
    console.log('App - Current user object:', user);
    console.log('App - role_id:', roleId, 'Type:', typeof roleId);
    
    // Ensure roleId is a number for comparison
    const numericRoleId = typeof roleId === 'number' ? roleId : null;
    console.log('App - Numeric roleId:', numericRoleId);
    
    // Route to admin dashboard if role_id is 1 (admin)
    if (roleId === "admin" || numericRoleId === 1) {
      console.log('Routing to AdminDashboard (role_id === 1)');
      return <AdminDashboard />;
    }
    
    console.log('Routing to RecruiterDashboard (role_id !== 1)');
    // Route to recruiter dashboard for all other roles
    return <RecruiterDashboard onJobSelect={(id) => setSelectedJobId(id)} />;
  }

  const handleForgotPasswordRequested = (email: string) => {
    setResetEmail(email);
    setScreen('verify-otp');
  };

  const handleOtpVerified = (otp: string) => {
    setVerifiedOtp(otp);
    setScreen('reset-password');
  };

  if (screen === 'verify-otp') {
    return (
      <VerifyOtpPage
        email={resetEmail}
        onVerified={handleOtpVerified}
        onBack={() => setScreen('login')}
      />
    );
  }

  if (screen === 'reset-password') {
    return (
      <ResetPasswordPage
        email={resetEmail}
        otp={verifiedOtp}
        onSuccess={() => setScreen('login')}
        onBack={() => setScreen('verify-otp')}
        onLoginClick={() => setScreen('login')}
      />
    );
  }

  return <LoginPage onForgotPasswordRequested={handleForgotPasswordRequested} />;
};

const App: React.FC = () => (
  <Provider store={store}>
    <AppInner />
  </Provider>
);

export default App;