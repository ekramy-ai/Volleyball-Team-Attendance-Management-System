import React from 'react';
import { AttendanceHistoryView } from './AttendanceHistoryView';
import { useApp } from '../../context/AppContext';

export const AttendanceView: React.FC = () => {
  const { language } = useApp();
  const isAr = language === 'ar';

  return (
    <AttendanceHistoryView
      title={isAr ? 'الأرشيف المركزي للحضور وسجلات الفرق' : 'Master Attendance History & Audit Records'}
      subtitle={isAr
        ? 'استعراض سجلات الحضور الشاملة لكافة فرق النادي، التصفية المتقدمة، وتعديل وتدقيق السجلات'
        : 'Club-wide attendance records archive, multi-criteria filtering, and audited status modifications'}
    />
  );
};
