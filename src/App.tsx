/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Dashboard } from "@/pages/Dashboard";
import { Residents } from "@/pages/Residents";
import { Finance } from "@/pages/Finance";
import { Letters } from "@/pages/Letters";
import { Announcements } from "@/pages/Announcements";
import { Reports } from "@/pages/Reports";
import { PrintCard } from "@/pages/PrintCard";
import { Settings } from "@/pages/Settings";
import { Login } from "@/pages/Login";
import { Profile } from "@/pages/Profile";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { role } = useAuth();
  
  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="residents" element={
              <ProtectedRoute requireAdmin>
                <Residents />
              </ProtectedRoute>
            } />
            <Route path="finance" element={<Finance />} />
            <Route path="letters" element={<Letters />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="reports" element={<Reports />} />
            <Route path="profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute requireAdmin>
                <Settings />
              </ProtectedRoute>
            } />
          </Route>
          
          <Route path="/print/card/:id" element={
            <ProtectedRoute requireAdmin>
              <PrintCard />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
