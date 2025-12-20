// PDF and CSV export utilities for timetables

interface TimetableEntry {
  day: string;
  time: string;
  subject: string;
  faculty: string;
  classroom: string;
}

interface TimetableData {
  name: string;
  schedule: TimetableEntry[];
}

// Generate and download PDF-ready HTML
export const generateTimetablePDF = (timetableData: TimetableData, departmentName: string, sectionName: string): void => {
  const { schedule, name: timetableName } = timetableData;
  
  // Get unique values with proper typing
  const timeSlots: string[] = [];
  const workingDays: string[] = [];
  
  schedule.forEach((entry: TimetableEntry) => {
    if (!timeSlots.includes(entry.time)) {
      timeSlots.push(entry.time);
    }
    if (!workingDays.includes(entry.day)) {
      workingDays.push(entry.day);
    }
  });
  
  timeSlots.sort();
  
  const currentDate = new Date().toLocaleDateString();
  
  // Count unique items with proper typing
  const uniqueSubjects: string[] = [];
  const uniqueFaculty: string[] = [];
  const uniqueClassrooms: string[] = [];
  
  schedule.forEach((entry: TimetableEntry) => {
    if (!uniqueSubjects.includes(entry.subject)) uniqueSubjects.push(entry.subject);
    if (!uniqueFaculty.includes(entry.faculty)) uniqueFaculty.push(entry.faculty);
    if (!uniqueClassrooms.includes(entry.classroom)) uniqueClassrooms.push(entry.classroom);
  });

  // Create print window
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download PDF');
    return;
  }

  // Sort days in proper order for headers
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sortedDays = workingDays.sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));
  
  // Generate table headers with proper string concatenation
  let tableHeaders = '<th class="time-slot">⏰ TIME</th>';
  sortedDays.forEach((day: string) => {
    tableHeaders += `<th>${day.toUpperCase()}</th>`;
  });

  // Generate table rows with proper timetable structure
  let tableRowsHTML = '';
  timeSlots.forEach((timeSlot: string) => {
    let cellsHTML = '';
    sortedDays.forEach((day: string) => {
      const entry = schedule.find((s: TimetableEntry) => s.day === day && s.time === timeSlot);
      
      // Check if this is a lunch time slot
      const isLunchTime = timeSlot.includes('12:30') || timeSlot.includes('13:00') || timeSlot.includes('13:30') || 
                          timeSlot.toLowerCase().includes('lunch');
      
      if (isLunchTime) {
        cellsHTML += '<td class="lunch-break">🍽️ LUNCH</td>';
      } else if (entry) {
        cellsHTML += '<td class="subject-cell">';
        cellsHTML += `<div class="subject-name">${entry.subject}</div>`;
        cellsHTML += `<div class="faculty-name">${entry.faculty}</div>`;
        cellsHTML += `<div class="classroom-name">${entry.classroom}</div>`;
        cellsHTML += '</td>';
      } else {
        cellsHTML += '<td class="free-slot">-</td>';
      }
    });
    
    tableRowsHTML += '<tr>';
    tableRowsHTML += `<td class="time-slot">${timeSlot}</td>`;
    tableRowsHTML += cellsHTML;
    tableRowsHTML += '</tr>';
  });

  // Build HTML content with string concatenation to avoid template literal issues
  let htmlContent = '<!DOCTYPE html><html><head>';
  htmlContent += `<title>Timetable - ${departmentName} - ${sectionName}</title>`;
  htmlContent += '<meta charset="UTF-8">';
  htmlContent += '<style>';
  htmlContent += '@media print { @page { size: A4 landscape; margin: 15mm; } }';
  htmlContent += 'body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #fff; color: #333; line-height: 1.6; }';
  htmlContent += '.header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1976d2; padding-bottom: 20px; }';
  htmlContent += '.header h1 { color: #1976d2; margin: 0 0 10px 0; font-size: 28px; font-weight: bold; }';
  htmlContent += '.subtitle { color: #666; font-size: 16px; margin: 5px 0; }';
  htmlContent += '.info-grid { display: flex; justify-content: space-around; margin: 25px 0; background: #f8f9ff; padding: 20px; border-radius: 10px; border-left: 5px solid #1976d2; }';
  htmlContent += '.info-item { text-align: center; }';
  htmlContent += '.info-item .label { font-size: 12px; color: #666; font-weight: 600; }';
  htmlContent += '.info-item .value { font-size: 18px; font-weight: bold; color: #1976d2; margin-top: 5px; }';
  htmlContent += '.timetable-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-size: 12px; }';
  htmlContent += '.timetable-table th { background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 15px 8px; text-align: center; font-weight: bold; border: 1px solid #1565c0; font-size: 13px; }';
  htmlContent += '.timetable-table td { padding: 12px 6px; text-align: center; border: 1px solid #ddd; min-height: 80px; vertical-align: middle; }';
  htmlContent += '.time-slot { background: #f0f4f8; font-weight: bold; color: #1976d2; width: 120px; font-size: 11px; }';
  htmlContent += '.subject-cell { background: #fff; padding: 8px 6px; }';
  htmlContent += '.subject-name { font-weight: bold; color: #1976d2; font-size: 12px; margin-bottom: 4px; }';
  htmlContent += '.faculty-name { color: #666; font-size: 10px; margin-bottom: 2px; }';
  htmlContent += '.classroom-name { color: #e91e63; font-weight: 500; font-size: 10px; }';
  htmlContent += '.lunch-break { background: linear-gradient(135deg, #ff9800, #f57c00); color: white; font-weight: bold; font-size: 11px; }';
  htmlContent += '.free-slot { background: #f9f9f9; color: #ccc; font-style: italic; font-size: 11px; }';
  htmlContent += '.footer { margin-top: 25px; text-align: center; color: #666; font-size: 11px; border-top: 2px solid #eee; padding-top: 15px; }';
  htmlContent += '</style></head><body>';
  
  // Header section
  htmlContent += '<div class="header">';
  htmlContent += '<h1>📚 Smart Timetable Schedule</h1>';
  htmlContent += `<div class="subtitle"><strong>Department:</strong> ${departmentName} | <strong>Section:</strong> ${sectionName}</div>`;
  htmlContent += `<div class="subtitle"><strong>Schedule:</strong> ${timetableName} | <strong>Generated:</strong> ${currentDate}</div>`;
  htmlContent += '</div>';

  // Info grid section
  htmlContent += '<div class="info-grid">';
  htmlContent += '<div class="info-item"><div class="label">🏢 DEPARTMENT</div><div class="value">' + departmentName + '</div></div>';
  htmlContent += '<div class="info-item"><div class="label">🎓 SECTION</div><div class="value">' + sectionName + '</div></div>';
  htmlContent += '<div class="info-item"><div class="label">📅 WORKING DAYS</div><div class="value">' + workingDays.length + '</div></div>';
  htmlContent += '<div class="info-item"><div class="label">⏰ TIME SLOTS</div><div class="value">' + timeSlots.length + '</div></div>';
  htmlContent += '<div class="info-item"><div class="label">📚 SUBJECTS</div><div class="value">' + uniqueSubjects.length + '</div></div>';
  htmlContent += '</div>';

  // Table section
  htmlContent += '<table class="timetable-table">';
  htmlContent += '<thead><tr>' + tableHeaders + '</tr></thead>';
  htmlContent += '<tbody>' + tableRowsHTML + '</tbody>';
  htmlContent += '</table>';

  // Footer section
  htmlContent += '<div class="footer">';
  htmlContent += '<p><strong>📋 Generated by Smart Timetable Scheduler</strong></p>';
  htmlContent += '<p>🕒 ' + new Date().toLocaleString() + ' | ⚡ Auto-optimized scheduling</p>';
  htmlContent += '<p>📊 ' + schedule.length + ' periods | 👨‍🏫 ' + uniqueFaculty.length + ' faculty | 🏛️ ' + uniqueClassrooms.length + ' classrooms</p>';
  htmlContent += '</div>';

  // Auto-print script
  htmlContent += '<script>';
  htmlContent += 'window.onload = function() {';
  htmlContent += 'setTimeout(function() {';
  htmlContent += 'window.print();';
  htmlContent += 'setTimeout(function() { window.close(); }, 1000);';
  htmlContent += '}, 500);';
  htmlContent += '};';
  htmlContent += '</script>';
  
  htmlContent += '</body></html>';

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

// Direct PDF download function without modal
export const downloadTimetablePDF = (timetableData: TimetableData, departmentName: string, sectionName: string): void => {
  generateTimetablePDF(timetableData, departmentName, sectionName);
};

// Show download options modal - now only PDF
export const showDownloadOptions = (timetableData: TimetableData, departmentName: string, sectionName: string): void => {
  generateTimetablePDF(timetableData, departmentName, sectionName);
};

export const generateFacultyTimetablePDF = (
  timetableData: TimetableData,
  departmentName: string,
  sectionName: string,
  facultyName: string
): void => {
  const { schedule, name: timetableName } = timetableData;

  if (!facultyName) {
    alert('Select a faculty member before downloading.');
    return;
  }

  const facultySchedule = schedule.filter((entry: TimetableEntry) => entry.faculty === facultyName);

  if (facultySchedule.length === 0) {
    alert('No timetable entries found for the selected faculty.');
    return;
  }

  const timeSlots = Array.from(new Set(schedule.map((entry: TimetableEntry) => entry.time))).sort();
  const workingDays = Array.from(new Set(schedule.map((entry: TimetableEntry) => entry.day)));

  const currentDate = new Date().toLocaleDateString();
  const uniqueSubjects = Array.from(new Set(facultySchedule.map((entry: TimetableEntry) => entry.subject)));
  const uniqueClassrooms = Array.from(new Set(facultySchedule.map((entry: TimetableEntry) => entry.classroom)));

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download PDF');
    return;
  }

  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sortedDays = workingDays.sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b));

  let tableHeaders = '<th class="time-slot">⏰ TIME</th>';
  sortedDays.forEach((day: string) => {
    tableHeaders += `<th>${day.toUpperCase()}</th>`;
  });

  let tableRowsHTML = '';
  timeSlots.forEach((timeSlot: string) => {
    let cellsHTML = '';
    const upperSlot = timeSlot.toUpperCase();
    const isLunchSlot = upperSlot.includes('LUNCH');
    const isBreakSlot = !isLunchSlot && upperSlot.includes('BREAK');

    sortedDays.forEach((day: string) => {
      if (isLunchSlot) {
        cellsHTML += '<td class="lunch-break">🍽️ LUNCH</td>';
        return;
      }

      if (isBreakSlot) {
        cellsHTML += '<td class="short-break">☕ BREAK</td>';
        return;
      }

      const entry = schedule.find(
        (s: TimetableEntry) => s.day === day && s.time === timeSlot && s.faculty === facultyName
      );

      if (entry) {
        cellsHTML += '<td class="subject-cell">';
        cellsHTML += `<div class="subject-name">${entry.subject}</div>`;
        cellsHTML += `<div class="classroom-name">${entry.classroom}</div>`;
        cellsHTML += '</td>';
      } else {
        cellsHTML += '<td class="free-slot">Free</td>';
      }
    });

    tableRowsHTML += '<tr>';
    tableRowsHTML += `<td class="time-slot">${timeSlot}</td>`;
    tableRowsHTML += cellsHTML;
    tableRowsHTML += '</tr>';
  });

  let htmlContent = '<!DOCTYPE html><html><head>';
  htmlContent += `<title>${facultyName} Timetable - ${departmentName}</title>`;
  htmlContent += '<meta charset="UTF-8">';
  htmlContent += '<style>';
  htmlContent += '@media print { @page { size: A4 landscape; margin: 15mm; } }';
  htmlContent += 'body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #fff; color: #333; line-height: 1.6; }';
  htmlContent += '.header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1976d2; padding-bottom: 20px; }';
  htmlContent += '.header h1 { color: #1976d2; margin: 0 0 10px 0; font-size: 28px; font-weight: bold; }';
  htmlContent += '.subtitle { color: #666; font-size: 16px; margin: 5px 0; }';
  htmlContent += '.info-grid { display: flex; justify-content: space-around; margin: 25px 0; background: #f8f9ff; padding: 20px; border-radius: 10px; border-left: 5px solid #1976d2; }';
  htmlContent += '.info-item { text-align: center; }';
  htmlContent += '.info-item .label { font-size: 12px; color: #666; font-weight: 600; }';
  htmlContent += '.info-item .value { font-size: 18px; font-weight: bold; color: #1976d2; margin-top: 5px; }';
  htmlContent += '.timetable-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-size: 12px; }';
  htmlContent += '.timetable-table th { background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 15px 8px; text-align: center; font-weight: bold; border: 1px solid #1565c0; font-size: 13px; }';
  htmlContent += '.timetable-table td { padding: 12px 6px; text-align: center; border: 1px solid #ddd; min-height: 80px; vertical-align: middle; }';
  htmlContent += '.time-slot { background: #f0f4f8; font-weight: bold; color: #1976d2; width: 120px; font-size: 11px; }';
  htmlContent += '.subject-cell { background: #fff; padding: 8px 6px; }';
  htmlContent += '.subject-name { font-weight: bold; color: #1976d2; font-size: 12px; margin-bottom: 4px; }';
  htmlContent += '.classroom-name { color: #e91e63; font-weight: 500; font-size: 10px; }';
  htmlContent += '.lunch-break { background: linear-gradient(135deg, #ff9800, #f57c00); color: white; font-weight: bold; font-size: 11px; }';
  htmlContent += '.short-break { background: linear-gradient(135deg, #26c6da, #00acc1); color: white; font-weight: bold; font-size: 11px; }';
  htmlContent += '.free-slot { background: #f9f9f9; color: #ccc; font-style: italic; font-size: 11px; }';
  htmlContent += '.footer { margin-top: 25px; text-align: center; color: #666; font-size: 11px; border-top: 2px solid #eee; padding-top: 15px; }';
  htmlContent += '</style></head><body>';

  htmlContent += '<div class="header">';
  htmlContent += '<h1>👨‍🏫 Faculty Timetable</h1>';
  htmlContent += `<div class="subtitle"><strong>Faculty:</strong> ${facultyName}</div>`;
  htmlContent += `<div class="subtitle"><strong>Department:</strong> ${departmentName} | <strong>Section:</strong> ${sectionName}</div>`;
  htmlContent += `<div class="subtitle"><strong>Schedule:</strong> ${timetableName} | <strong>Generated:</strong> ${currentDate}</div>`;
  htmlContent += '</div>';

  htmlContent += '<div class="info-grid">';
  htmlContent += '<div class="info-item"><div class="label">📅 TOTAL CLASSES</div><div class="value">' + facultySchedule.length + '</div></div>';
  htmlContent += '<div class="info-item"><div class="label">📚 UNIQUE SUBJECTS</div><div class="value">' + uniqueSubjects.length + '</div></div>';
  htmlContent += '<div class="info-item"><div class="label">🏛️ CLASSROOMS</div><div class="value">' + uniqueClassrooms.length + '</div></div>';
  htmlContent += '<div class="info-item"><div class="label">📅 WORKING DAYS</div><div class="value">' + sortedDays.length + '</div></div>';
  htmlContent += '</div>';

  htmlContent += '<table class="timetable-table">';
  htmlContent += '<thead><tr>' + tableHeaders + '</tr></thead>';
  htmlContent += '<tbody>' + tableRowsHTML + '</tbody>';
  htmlContent += '</table>';

  htmlContent += '<div class="footer">';
  htmlContent += '<p><strong>📋 Generated by Smart Timetable Scheduler</strong></p>';
  htmlContent += '<p>🕒 ' + new Date().toLocaleString() + ' | 👨‍🏫 Faculty-focused schedule export</p>';
  htmlContent += '<p>📚 ' + uniqueSubjects.length + ' subjects | 🏛️ ' + uniqueClassrooms.length + ' classrooms</p>';
  htmlContent += '</div>';

  htmlContent += '<script>';
  htmlContent += 'window.onload = function() {';
  htmlContent += 'setTimeout(function() {';
  htmlContent += 'window.print();';
  htmlContent += 'setTimeout(function() { window.close(); }, 1000);';
  htmlContent += '}, 500);';
  htmlContent += '};';
  htmlContent += '</script>';

  htmlContent += '</body></html>';

  printWindow.document.write(htmlContent);
  printWindow.document.close();
};

export const downloadFacultyTimetablePDF = (
  timetableData: TimetableData,
  departmentName: string,
  sectionName: string,
  facultyName: string
): void => {
  generateFacultyTimetablePDF(timetableData, departmentName, sectionName, facultyName);
};