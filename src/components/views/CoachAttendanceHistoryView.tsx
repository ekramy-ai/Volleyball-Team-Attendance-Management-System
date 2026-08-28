import React from 'react';
import { AttendanceHistoryView } from './AttendanceHistoryView';
import { useApp } from '../../context/AppContext';

export const CoachAttendanceHistoryView: React.FC = () => {
  const { language } = useApp();
  const isAr = language === 'ar';

  return (
    <AttendanceHistoryView
      title={isAr ? 'أرشيف كشوفات الحضور للفرق المصرحة' : 'Team Attendance History & Records'}
      subtitle={isAr
        ? 'أرشيف كشوفات الحضور لفرقك المعتمدة، استعراض فترات التدريب، وتعديل السجلات الموثقة'
        : 'Attendance archive for your assigned squads, period exploration, and verified record adjustments'}
    />
  );
};
