import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentProfile, WellnessSurvey, FacultyFeedback, InterventionAssignment } from '../types';

// --- Helper: Add Branding Header ---
const addHeader = (doc: jsPDF, title: string, subTitle?: string) => {
    const pageWidth = doc.internal.pageSize.width;
    
    // Background Header
    doc.setFillColor(79, 70, 229); // Indigo-600
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo (Simulated)
    doc.setFillColor(255, 255, 255);
    doc.circle(20, 20, 10, 'F');
    doc.setTextColor(79, 70, 229);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("WN", 16, 24);

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("WellNex", 35, 20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("Intelligent Student Wellness System", 35, 28);

    // Report Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth - 20, 20, { align: 'right' });
    if (subTitle) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(subTitle, pageWidth - 20, 28, { align: 'right' });
    }

    // Footer Line
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(10, 35, pageWidth - 10, 35);
};

// --- Helper: Add Footer ---
const addFooter = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generated on ${new Date().toLocaleString()} | Confidential Document`, 10, pageHeight - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
    }
};

// --- Student Report ---
export const generateStudentReport = (student: StudentProfile, surveys: WellnessSurvey[], feedback: FacultyFeedback | null, assignments: InterventionAssignment[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    addHeader(doc, "Student Wellness Profile", `Roll No: ${student.rollNumber}`);

    let yPos = 50;

    // 1. Student Details Card
    doc.setFillColor(248, 250, 252); // Slate-50
    doc.roundedRect(10, yPos, pageWidth - 20, 45, 3, 3, 'F');
    
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Student Information", 15, yPos + 10);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${student.name}`, 15, yPos + 20);
    doc.text(`Year: ${student.year}`, 120, yPos + 20);
    
    doc.text(`Department: ${student.department}`, 15, yPos + 28);
    doc.text(`Email: ${student.email}`, 15, yPos + 36);

    yPos += 55;

    // 2. Wellness Summary Metrics
    const avgStress = surveys.length > 0 ? (surveys.reduce((acc, curr) => acc + curr.stressLevel, 0) / surveys.length).toFixed(1) : "N/A";
    const avgSleep = surveys.length > 0 ? (surveys.reduce((acc, curr) => acc + curr.sleepQuality, 0) / surveys.length).toFixed(1) : "N/A";
    const latestRisk = feedback?.status || "NORMAL";

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Wellness Overview", 10, yPos);
    yPos += 5;

    // Metric Cards
    const cardWidth = (pageWidth - 40) / 3;
    
    // Stress Card
    doc.setFillColor(254, 242, 242); // Red-50
    doc.roundedRect(10, yPos, cardWidth, 25, 2, 2, 'F');
    doc.setTextColor(185, 28, 28);
    doc.setFontSize(9);
    doc.text("Avg Stress Level", 15, yPos + 8);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${avgStress}/10`, 15, yPos + 18);

    // Sleep Card
    doc.setFillColor(239, 246, 255); // Blue-50
    doc.roundedRect(20 + cardWidth, yPos, cardWidth, 25, 2, 2, 'F');
    doc.setTextColor(29, 78, 216);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text("Avg Sleep Quality", 25 + cardWidth, yPos + 8);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${avgSleep}/10`, 25 + cardWidth, yPos + 18);

    // Risk Card
    let riskColor = [16, 185, 129]; // Green
    let riskBg = [236, 253, 245]; // Green-50
    if (latestRisk === 'HIGH_RISK' || latestRisk === 'CRITICAL') {
        riskColor = [239, 68, 68]; // Red
        riskBg = [254, 242, 242];
    } else if (latestRisk === 'MODERATE') {
        riskColor = [245, 158, 11]; // Orange
        riskBg = [255, 251, 235];
    }

    doc.setFillColor(riskBg[0], riskBg[1], riskBg[2]);
    doc.roundedRect(30 + (cardWidth * 2), yPos, cardWidth, 25, 2, 2, 'F');
    doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text("Current Risk Status", 35 + (cardWidth * 2), yPos + 8);
    doc.setFontSize(12); // Smaller font for text status
    doc.setFont('helvetica', 'bold');
    doc.text(latestRisk.replace('_', ' '), 35 + (cardWidth * 2), yPos + 18);

    yPos += 35;

    // 3. Survey History Table
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(12);
    doc.text("Recent Wellness Surveys", 10, yPos);
    
    autoTable(doc, {
        startY: yPos + 5,
        head: [['Date', 'Stress (1-10)', 'Sleep (1-10)', 'Pressure (1-10)', 'Mood']],
        body: surveys.slice(0, 10).map(s => [s.date, s.stressLevel, s.sleepQuality, s.academicPressure, s.mood]),
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 9, cellPadding: 3 },
        theme: 'grid'
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // 4. Interventions Table
    if (assignments.length > 0) {
        doc.text("Assigned Interventions", 10, yPos);
        autoTable(doc, {
            startY: yPos + 5,
            head: [['Date', 'Strategy', 'Status', 'Assigned By']],
            body: assignments.map(a => [a.assignedDate, a.strategy, a.status.replace('_', ' '), a.facultyName]),
            headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
            theme: 'grid'
        });
    }

    addFooter(doc);
    doc.save(`WellNex_Student_Report_${student.rollNumber}.pdf`);
};

// --- Admin System Report ---
export const generateSystemReport = (
    stats: any, 
    deptData: {name: string, stress: number, sleep: number}[],
    highRiskStudents: any[]
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    addHeader(doc, "Institutional Wellness Report", "Executive Summary");

    let yPos = 50;

    // 1. Executive Summary
    doc.setFontSize(14);
    doc.setTextColor(51, 65, 85);
    doc.text("Executive Summary", 10, yPos);
    yPos += 10;

    const summaryData = [
        ['Total Students', stats.total],
        ['High Risk Cases', stats.highRisk],
        ['Moderate Risk', stats.moderate],
        ['Active Support Tickets', stats.activeTickets],
        ['Missing Check-ins (>3 days)', stats.missingCheckins]
    ];

    autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Count']],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        columnStyles: { 0: { fontStyle: 'bold' } }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // 2. Department Analysis
    doc.text("Departmental Analysis", 10, yPos);
    yPos += 5;

    autoTable(doc, {
        startY: yPos,
        head: [['Department', 'Avg Stress', 'Avg Sleep']],
        body: deptData.map(d => [d.name, d.stress.toFixed(1), d.sleep.toFixed(1)]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // 3. High Risk Students List (Confidential)
    doc.setTextColor(185, 28, 28);
    doc.text("High Risk Students - Attention Required", 10, yPos);
    yPos += 5;

    autoTable(doc, {
        startY: yPos,
        head: [['Roll No', 'Name', 'Dept', 'Stress', 'Status']],
        body: highRiskStudents.map(s => [s.rollNumber, s.name, s.department, s.lastSurvey?.stressLevel || 'N/A', s.status]),
        headStyles: { fillColor: [220, 38, 38] },
        theme: 'grid'
    });

    addFooter(doc);
    doc.save(`WellNex_Institutional_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};
