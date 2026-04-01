import prisma from '../utils/prisma.js';
import { sendRealEmail } from './email.service.js';
export const calculateRisk = async (
  userId: string,
  stressLevel: number,
  sleepQuality: number,
  academicPressure: number,
  studentName?: string,
  studentDept?: string
) => {
  // Risk Score Logic
  // High risk if Stress > 7
  
  let riskScore = 0; // Baseline
  let isHighRisk = false;

  if (stressLevel > 7) {
    isHighRisk = true;
    riskScore = 100; // E.g., MAX risk
  } else {
    // Weighted wellness calculation
    // Lower sleep is bad, high stress is bad.
    const stressFactor = (stressLevel / 10) * 40; // 40% weight
    const pressureFactor = (academicPressure / 10) * 40; // 40% weight
    const sleepFactor = ((10 - sleepQuality) / 10) * 20; // 20% weight

    riskScore = Math.round(stressFactor + pressureFactor + sleepFactor);
  }

  // If High Risk, notify Counselor/Admin automatically
  if (isHighRisk) {
    // Determine the user name
    const student = await prisma.user.findUnique({ where: { id: userId }});
    const finalStudentName = studentName || student?.name || userId;
    const message = `HIGH RISK Alert: Student ${finalStudentName} has reported severely negative wellness metrics. Immediate follow-up recommended.`;

    // Find system counselors/faculty to notify
    const targetDept = (student as any)?.department || studentDept;
    const allStaff = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN'] }
      }
    });
    
    // Filter to only include Faculty from the student's department AND General Counselors
    const staff = allStaff.filter(member => 
        member.department === 'General' || 
        member.department === 'Counseling' ||
        member.department === targetDept || 
        !member.department
    );

    // Send Real Emails to Faculty (Unique only)
    const emailRecipients = new Set<string>();
    for (const member of staff) {
        const recipientEmail = member.email?.includes('@wellnex.edu') && process.env.EMAIL_USER
            ? process.env.EMAIL_USER 
            : member.email;
        if (recipientEmail) emailRecipients.add(recipientEmail);
    }

    for (const recipientEmail of emailRecipients) {
        const member = staff.find(s => 
            (s.email === recipientEmail) || 
            (s.email?.includes('@wellnex.edu') && recipientEmail === process.env.EMAIL_USER)
        );

        if (recipientEmail && member) {
           console.log(`[Risk Service] Preparing to send high-risk email to: ${recipientEmail}`);
           const subject = `URGENT: High Risk Alert for Student ${finalStudentName}`;
           // ... (rest of template)
           const html = `
             <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 12px; background-color: #ffffff;">
               <div style="text-align: center; margin-bottom: 30px; background-color: #ef4444; padding: 20px; border-radius: 8px 8px 0 0;">
                 <h1 style="color: #ffffff; margin: 0; font-size: 24px;">High Risk Wellness Alert</h1>
                 <p style="color: #fee2e2; font-size: 14px; margin: 5px 0 0 0;">WellNex Monitoring System</p>
               </div>
               <div style="padding: 20px; color: #1e293b;">
                 <p>Dear <strong>${member.name}</strong>,</p>
                 <p>The system has flagged a student as <strong>HIGH RISK</strong> based on their latest wellness survey results. Immediate intervention is recommended.</p>
                 
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                   <h3 style="margin-top: 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Student Details</h3>
                   <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                     <tr><td style="padding: 8px 0; color: #64748b; width: 40%;">Name:</td><td style="padding: 8px 0; font-weight: 600;">${finalStudentName}</td></tr>
                     <tr><td style="padding: 8px 0; color: #64748b;">Registration Number:</td><td style="padding: 8px 0; font-weight: 600;">${(student as any)?.rollNumber || userId}</td></tr>
                     <tr><td style="padding: 8px 0; color: #64748b;">Department:</td><td style="padding: 8px 0; font-weight: 600;">${(student as any)?.department || studentDept || 'General'}</td></tr>
                   </table>
                 </div>

                 <div style="background-color: #fff5f5; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #feb2b2;">
                   <h3 style="margin-top: 0; color: #c53030; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Wellness Metrics</h3>
                   <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                     <tr><td style="padding: 8px 0; color: #c53030; width: 40%;">Stress Level:</td><td style="padding: 8px 0; font-weight: 700;">${stressLevel}/10</td></tr>
                     <tr><td style="padding: 8px 0; color: #c53030;">Sleep Quality:</td><td style="padding: 8px 0; font-weight: 700;">${sleepQuality}/10</td></tr>
                     <tr><td style="padding: 8px 0; color: #c53030;">Academic Pressure:</td><td style="padding: 8px 0; font-weight: 700;">${academicPressure}/10</td></tr>
                   </table>
                 </div>

                 <p style="font-size: 14px; line-height: 1.6;">Please log in to the faculty dashboard to review the full interaction history and initiate support protocols.</p>
                 
                 <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Open Admin Dashboard</a>
                 </div>
               </div>
               <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
                 <p>&copy; ${new Date().getFullYear()} WellNex System. This is an automated security alert.</p>
               </div>
             </div>
           `;

           await sendRealEmail(
               recipientEmail,
               subject,
               `URGENT: High Risk Alert for Student ${finalStudentName}\n\nPlease check the dashboard.`,
               html
           );
        }
    }

    // Create notifications
    const notifications = staff.map((s: any) => ({
      userId: s.id,
      message,
      type: 'URGENT_ALERT',
    }));

    if (notifications.length > 0) {
      try {
        await prisma.notification.createMany({
          data: notifications
        });
      } catch (e) {
        console.warn('⚠️ Could not create DB notifications (mock user ID constraint)');
      }
    }
    
    // Auto-create a recommendation for the student
    try {
        await prisma.recommendation.create({
          data: {
            studentId: userId,
            title: 'Emergency Contact & Support',
            description: 'We noticed you are experiencing heavy distress. Please reach out to our on-campus counselor immediately or call the student helpline.',
            category: 'EMERGENCY',
            createdBy: 'SYSTEM_AI'
          }
        });
    } catch (e) {
        console.warn('⚠️ Could not save recommendation to DB (mock user ID constraint)');
    }
  }

  return riskScore;
};

export const calculateOverallWellnessScore = (stressLevel: number, sleepQuality: number, mood: string, academicPressure: number) => {
    // Wellness Score Calculation (0-100)
    // Positive factors increase it, negative factors decrease it.
    let score = 100;
    
    // Deductions
    score -= (stressLevel * 3); // max -30
    score -= (academicPressure * 3); // max -30
    
    // Additions
    score -= ((10 - sleepQuality) * 4); // max -40 (if you sleep 0. if sleep 10, -0)
    
    if (score < 0) score = 0;
    return score;
}
