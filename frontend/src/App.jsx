import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginView } from './views/LoginView';
import { RegisterView } from './views/RegisterView';
import { ExercisesView } from './views/ExercisesView';
import { StudentsView } from './views/StudentsView';
import { RoutinesView } from './views/RoutinesView';
import { MyRoutinesView } from './views/MyRoutinesView';
import { ProgressView } from './views/ProgressView';
import { AnalyticsView } from './views/AnalyticsView';

const AppContent = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('exercises');

  // Check URL query param for student register token (e.g. ?token=XYZ)
  const queryParams = new URLSearchParams(window.location.search);
  const registerToken = queryParams.get('token');

  if (registerToken) {
    return (
      <RegisterView
        token={registerToken}
        onRegistered={() => {
          window.location.href = window.location.pathname; // Clear query param
        }}
      />
    );
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--md-sys-color-background)',
        color: 'var(--md-sys-color-tertiary)'
      }}>
        Cargando Mottus Gym...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Adjust default tab based on user role
  const isStudent = user?.role === 'user';
  const effectiveTab = isStudent 
    ? (activeTab === 'progress' ? 'progress' : 'my-routines') 
    : activeTab;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={effectiveTab} setActiveTab={setActiveTab} />
      
      <main style={{ flex: 1 }}>
        {isStudent ? (
          <>
            {effectiveTab === 'my-routines' && <MyRoutinesView />}
            {effectiveTab === 'progress' && <ProgressView />}
          </>
        ) : (
          <>
            {activeTab === 'exercises' && <ExercisesView />}
            {activeTab === 'routines' && <RoutinesView />}
            {activeTab === 'students' && <StudentsView />}
            {activeTab === 'analytics' && <AnalyticsView />}
          </>
        )}
      </main>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
