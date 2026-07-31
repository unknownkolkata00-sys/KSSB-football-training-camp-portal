export function calculateExactAge(dobString?: string, fallbackAge?: number): {
  years: number;
  months: number;
  days: number;
  displayText: string;
  formattedDOB: string;
} {
  const defaultYears = fallbackAge || 0;
  if (!dobString || !dobString.trim()) {
    return {
      years: defaultYears,
      months: 0,
      days: 0,
      displayText: defaultYears > 0 ? `${defaultYears} Yrs` : 'N/A',
      formattedDOB: ''
    };
  }

  let year = 0, month = 0, day = 0;
  const str = dobString.trim();

  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        // DD/MM/YYYY
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }
    }
  } else if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        // DD-MM-YYYY
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }
    }
  }

  if (!year || isNaN(year) || isNaN(month) || !day || isNaN(day)) {
    return {
      years: defaultYears,
      months: 0,
      days: 0,
      displayText: defaultYears > 0 ? `${defaultYears} Yrs` : 'N/A',
      formattedDOB: dobString
    };
  }

  const dobDate = new Date(year, month, day);
  const today = new Date();

  let yrs = today.getFullYear() - dobDate.getFullYear();
  let mos = today.getMonth() - dobDate.getMonth();
  let days = today.getDate() - dobDate.getDate();

  if (days < 0) {
    mos -= 1;
    const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (mos < 0) {
    yrs -= 1;
    mos += 12;
  }

  if (yrs < 0) yrs = 0;

  const paddedDay = String(day).padStart(2, '0');
  const paddedMonth = String(month + 1).padStart(2, '0');
  const formattedDOB = `${paddedDay}/${paddedMonth}/${year}`;

  let displayText = `${yrs} Yrs`;
  if (mos > 0) {
    displayText += ` ${mos}m`;
  }

  return {
    years: yrs,
    months: mos,
    days: days,
    displayText,
    formattedDOB
  };
}

export function formatDateToDDMMYYYY(dateStr?: string): string {
  if (!dateStr || !dateStr.trim()) return 'N/A';
  const str = dateStr.trim();
  if (str.includes('/')) return str; // Already DD/MM/YYYY
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      // YYYY-MM-DD
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  return str;
}
