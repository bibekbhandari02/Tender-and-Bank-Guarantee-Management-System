import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import TenderList from './pages/TenderList';
import TenderCreate from './pages/TenderCreate';
import TenderEdit from './pages/TenderEdit';
import TenderDetail from './pages/TenderDetail';
import ExpiringGuarantees from './pages/ExpiringGuarantees';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#f8fafc' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#f8fafc' } },
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="tenders" element={<TenderList />} />
          <Route path="tenders/new" element={<TenderCreate />} />
          <Route path="tenders/:id" element={<TenderDetail />} />
          <Route path="tenders/:id/edit" element={<TenderEdit />} />
          <Route path="guarantees/expiring" element={<ExpiringGuarantees />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
