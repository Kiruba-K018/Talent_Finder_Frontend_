import React, { useState, useRef, useEffect } from 'react';
import { Provider } from 'react-redux';
import { store} from './redux/store';
import { useAppSelector, useAppDispatch } from './hooks/hooks';
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
  const [isNewlyCreated, setIsNewlyCreated] = useState(false);
  const createdJobsRef = useRef<Map<string, number>>(new Map());
  const NEW_JOB_WINDOW_MS = 5000; // 5 seconds window to consider job as "new"

  // When job is selected, check if it was recently created
  const handleJobSelect = (jobId: string) => {
    const createdTime = createdJobsRef.current.get(jobId);
    const isNew = createdTime && (Date.now() - createdTime) < NEW_JOB_WINDOW_MS;
    setIsNewlyCreated(!!isNew);
    setSelectedJobId(jobId);
  };

  // Subscribe to job creation to track newly created jobs
  const lastCreatedJobId = useAppSelector((s) => (s.jobPost as any).lastCreatedJobId);
  
  useEffect(() => {
    if (lastCreatedJobId) {
      createdJobsRef.current.set(lastCreatedJobId, Date.now());
      // Clean up old entries after window time
      const cleanup = setTimeout(() => {
        createdJobsRef.current.delete(lastCreatedJobId);
      }, NEW_JOB_WINDOW_MS + 1000);
      return () => clearTimeout(cleanup);
    }
  }, [lastCreatedJobId]);

  if (isAuthenticated) {
    if (selectedJobId) {
      return (
        <JobDetailPage
          jobId={selectedJobId}
          onBack={() => setSelectedJobId(null)}
          isNewlyCreated={isNewlyCreated}
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
    return <RecruiterDashboard onJobSelect={handleJobSelect} />;
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