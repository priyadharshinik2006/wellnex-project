import { StudentProfile, WellnessSurvey, RiskStatus } from '../types';
import { logSystemAction } from './storageService';

// --- Mock Email Service ---
// In a real application, this would connect to a backend API (e.g., SendGrid, AWS SES).
// Here, we simulate email sending by logging to localStorage and console.

export interface EmailLog {
    id: string;
    to: string;
    subject: string;
    body: string;
    timestamp: number;
    status: 'SENT' | 'FAILED';
}

const EMAIL_STORAGE_KEY = 'wellnex_sent_emails';

export const sendEmail = (to: string, subject: string, body: string): boolean => {
    try {
        const emails: EmailLog[] = JSON.parse(localStorage.getItem(EMAIL_STORAGE_KEY) || '[]');
        
        const newEmail: EmailLog = {
            id: crypto.randomUUID(),
            to,
            subject,
            body,
            timestamp: Date.now(),
            status: 'SENT'
        };

        emails.unshift(newEmail);
        localStorage.setItem(EMAIL_STORAGE_KEY, JSON.stringify(emails));
        
        // Log to system logs as well
        logSystemAction('EMAIL_SENT', `Email sent to ${to}: ${subject}`, 'System');
        
        console.log(`[Mock Email Service] To: ${to}, Subject: ${subject}`);
        return true;
    } catch (error) {
        console.error("Failed to send email", error);
        return false;
    }
};

export const getSentEmails = (): EmailLog[] => {
    return JSON.parse(localStorage.getItem(EMAIL_STORAGE_KEY) || '[]');
};

// --- Alert Logic ---

export const checkAndSendHighRiskAlert = (student: StudentProfile, survey: WellnessSurvey) => {
    // Check if an alert was already sent for this specific survey entry to prevent duplication
    const sentAlertIds: string[] = JSON.parse(localStorage.getItem('wellnex_sent_alert_ids') || '[]');
    if (sentAlertIds.includes(survey.id)) {
        return false;
    }

    // Criteria: Stress > 8 AND Sleep < 4 OR Stress > 8 AND Pressure > 8 AND Sleep < 2
    const isHighRisk = (survey.stressLevel >= 8 && survey.sleepQuality < 4) || 
                       (survey.stressLevel >= 8 && survey.academicPressure >= 8 && survey.sleepQuality < 2);

    if (isHighRisk) {
        const facultyEmail = "priyadharshini.k2345@gmail.com"; 
        const subject = `URGENT: High Risk Alert for Student ${student.name} (${student.rollNumber})`;
        const body = `
            Dear Faculty Advisor,

            This is an automated alert from the WellNex System.

            Student: ${student.name}
            Roll Number: ${student.rollNumber}
            Department: ${student.department}

            Current Metrics (Critical):
            - Stress Level: ${survey.stressLevel}/10
            - Sleep Quality: ${survey.sleepQuality}/10
            - Academic Pressure: ${survey.academicPressure}/10
            - Mood: ${survey.mood}

            The system has flagged this student as HIGH RISK based on recent survey data.
            Immediate intervention or counseling referral is recommended.

            Regards,
            WellNex Intelligent System
        `;

        const sent = sendEmail(facultyEmail, subject, body);
        if (sent) {
            sentAlertIds.push(survey.id);
            localStorage.setItem('wellnex_sent_alert_ids', JSON.stringify(sentAlertIds));
        }
        return true;
    }
    return false;
};
