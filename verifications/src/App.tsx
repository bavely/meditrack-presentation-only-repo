// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/verify" replace />} />
      <Route path="/verify" element={<VerifyEmailPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="*" element={<div>404 - Not Found</div>} />
    </Routes>
  );
}