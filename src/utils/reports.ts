import { Student, PerformanceMetric, FeeStatus } from '../types';

/**
 * Downloads a comprehensive CSV report for Camp Attendance.
 */
export function downloadAttendanceReportCSV(students: Student[], metrics: PerformanceMetric[]) {
  const timestamp = new Date().toISOString().split('T')[0];

  // Helper to calculate student-level stats
  const studentSummaries = students.map(s => {
    const sMetrics = metrics.filter(m => m.studentId === s.id);
    const totalSessions = sMetrics.length;
    const present = sMetrics.filter(m => m.attendance === 'Present').length;
    const absent = sMetrics.filter(m => m.attendance === 'Absent').length;
    const excused = sMetrics.filter(m => m.attendance === 'Excused').length;
    const rate = totalSessions > 0 ? Math.round((present / totalSessions) * 100) : 100;

    return {
      regNo: s.registrationNumber || 'N/A',
      name: s.name,
      position: s.position,
      status: s.status,
      totalSessions,
      present,
      absent,
      excused,
      rate: `${rate}%`,
      parentName: s.parentName,
      parentPhone: s.parentPhone
    };
  });

  // Calculate overall metrics
  const totalMarkings = metrics.length;
  const totalPresent = metrics.filter(m => m.attendance === 'Present').length;
  const overallRate = totalMarkings > 0 ? Math.round((totalPresent / totalMarkings) * 100) : 100;

  // Build CSV content
  const lines: string[] = [];

  // Title & Metadata
  lines.push(`"KADAMTALA SPORTING SUBHAS BHOWMICK FOOTBALL CAMP (KSSB FC)"`);
  lines.push(`"CAMP ATTENDANCE & ATHLETIC PERFORMANCE SUMMARY REPORT"`);
  lines.push(`"Generated On: ${new Date().toLocaleString()}"`);
  lines.push(`"Total Enrolled Athletes: ${students.length}","Total Attendance Logs: ${totalMarkings}","Overall Camp Attendance Rate: ${overallRate}%"`);
  lines.push('');

  // Table 1: Student Attendance Summary
  lines.push(`"--- ATHLETE ATTENDANCE RATE SUMMARY ---"`);
  lines.push([
    '"Registration No."',
    '"Student Athlete Name"',
    '"Position"',
    '"Enrollment Status"',
    '"Total Sessions"',
    '"Present Sessions"',
    '"Absent Sessions"',
    '"Excused Sessions"',
    '"Attendance Rate (%)"',
    '"Parent/Guardian Name"',
    '"Contact Phone"'
  ].join(','));

  studentSummaries.forEach(s => {
    lines.push([
      `"${s.regNo}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.position}"`,
      `"${s.status}"`,
      `"${s.totalSessions}"`,
      `"${s.present}"`,
      `"${s.absent}"`,
      `"${s.excused}"`,
      `"${s.rate}"`,
      `"${s.parentName.replace(/"/g, '""')}"`,
      `"${s.parentPhone}"`
    ].join(','));
  });

  lines.push('');
  lines.push(`"--- DETAILED SESSION-BY-SESSION ATTENDANCE & METRICS LOG ---"`);
  lines.push([
    '"Session Date"',
    '"Registration No."',
    '"Student Athlete Name"',
    '"Attendance Status"',
    '"40yd Sprint (sec)"',
    '"Cone Agility (sec)"',
    '"Passing Acc (1-10)"',
    '"Shooting Prec (1-10)"',
    '"Stamina (1-10)"',
    '"Coach Evaluation Notes"'
  ].join(','));

  // Sorted session metrics
  const sortedMetrics = [...metrics].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  sortedMetrics.forEach(m => {
    const s = students.find(st => st.id === m.studentId);
    lines.push([
      `"${m.date}"`,
      `"${s?.registrationNumber || 'N/A'}"`,
      `"${(s?.name || 'Unknown Athlete').replace(/"/g, '""')}"`,
      `"${m.attendance}"`,
      `"${m.speed || '-'}"`,
      `"${m.agility || '-'}"`,
      `"${m.passing || '-'}"`,
      `"${m.shooting || '-'}"`,
      `"${m.stamina || '-'}"`,
      `"${(m.notes || '').replace(/"/g, '""')}"`
    ].join(','));
  });

  // Download Trigger
  const csvBlob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(csvBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `KSSB_FC_Attendance_Report_${timestamp}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a comprehensive CSV report for Fees and Financial Ledgers.
 */
export function downloadFeesReportCSV(students: Student[], fees: FeeStatus[], selectedMonth?: string) {
  const timestamp = new Date().toISOString().split('T')[0];
  const filteredFees = selectedMonth && selectedMonth !== 'All' 
    ? fees.filter(f => f.month === selectedMonth) 
    : fees;

  const totalDues = filteredFees.reduce((sum, f) => sum + f.amount, 0);
  const totalCollected = filteredFees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
  const totalOutstanding = filteredFees.filter(f => f.status !== 'Paid').reduce((sum, f) => sum + f.amount, 0);
  const paidCount = filteredFees.filter(f => f.status === 'Paid').length;
  const pendingCount = filteredFees.filter(f => f.status === 'Pending').length;
  const overdueCount = filteredFees.filter(f => f.status === 'Overdue').length;

  const lines: string[] = [];

  // Title Header
  lines.push(`"KADAMTALA SPORTING SUBHAS BHOWMICK FOOTBALL CAMP (KSSB FC)"`);
  lines.push(`"FINANCIAL LEDGER & FEES COLLECTION SUMMARY REPORT"`);
  lines.push(`"Billing Period Focus: ${selectedMonth || 'All Months'}"`);
  lines.push(`"Report Generated On: ${new Date().toLocaleString()}"`);
  lines.push(`"Total Records: ${filteredFees.length}","Total Dues: ₹${totalDues}","Total Collected: ₹${totalCollected}","Total Outstanding: ₹${totalOutstanding}"`);
  lines.push(`"Settlement Count: ${paidCount} Paid","${pendingCount} Pending","${overdueCount} Overdue"`);
  lines.push('');

  // Table Headers
  lines.push([
    '"Billing Month"',
    '"Registration No."',
    '"Student Athlete Name"',
    '"Position"',
    '"Enrollment Status"',
    '"Fee Amount (INR)"',
    '"Payment Status"',
    '"Settlement Date"',
    '"Payment Channel / Method"',
    '"Parent / Guardian Name"',
    '"Parent Email"',
    '"Parent Phone"'
  ].join(','));

  filteredFees.forEach(f => {
    const s = students.find(st => st.id === f.studentId);
    lines.push([
      `"${f.month}"`,
      `"${s?.registrationNumber || 'N/A'}"`,
      `"${(s?.name || 'Unknown Athlete').replace(/"/g, '""')}"`,
      `"${s?.position || '-'}"`,
      `"${s?.status || '-'}"`,
      `"${f.amount}"`,
      `"${f.status}"`,
      `"${f.paymentDate || 'Unsettled'}"`,
      `"${f.paymentMethod || 'Awaiting Payment'}"`,
      `"${(s?.parentName || '-').replace(/"/g, '""')}"`,
      `"${s?.parentEmail || '-'}"`,
      `"${s?.parentPhone || '-'}"`
    ].join(','));
  });

  // Download Trigger
  const csvBlob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(csvBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `KSSB_FC_Fees_Ledger_Report_${selectedMonth ? selectedMonth.replace(/\s+/g, '_') : 'All'}_${timestamp}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
