import React, { useState } from 'react';
import { Provider } from 'react-redux';
import { store} from './redux/store';
import { useAppSelector } from './hooks/hooks';
import LoginPage from './pages/Loginpage';
import VerifyOtpPage from './pages/Verifyotppage';
import ResetPasswordPage from './pages/Resetpasswordpage';
import RecruiterDashboard from './pages/Recruiterdashboard';
import JobDetailPage from './pages/Jobdetailpage';

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
    const role = user?.role?.toLowerCase();
    if (role === 'recruiter' || !role) {
      return <RecruiterDashboard onJobSelect={(id) => setSelectedJobId(id)} />;
    }
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