import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppContent from './components/AppContent';
import { UserProvider } from './contexts/UserContext';
import PerformanceMonitor from './components/PerformanceMonitor';
import './styles/App.css';

function App() {
    return (
        <Router>
            <UserProvider>
                <PerformanceMonitor>
                    <div className="min-h-screen bg-gray-50">
                        <AppContent />
                    </div>
                </PerformanceMonitor>
            </UserProvider>
        </Router>
    );
}

export default App;