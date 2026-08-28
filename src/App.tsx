/**
 * Volleyball Attendance Management System - Phase 3: Application Foundation and Main User Interface
 */

import React from 'react';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
