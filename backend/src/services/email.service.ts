import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return null;
    }
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS.replace(/\s/g, ''), // Ensure no spaces
      },
    });
  }
  return transporter;
};

export const sendRealEmail = async (to: string, subject: string, text: string, html?: string): Promise<boolean> => {
  try {
    const activeTransporter = getTransporter();
    
    if (!activeTransporter) {
      console.warn('⚠️ EMAIL_USER or EMAIL_PASS not set in backend/.env. Email not sent.');
      return false;
    }

    const info = await activeTransporter.sendMail({
      from: `"WellNex System" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`✅ Real Email sent successfully! Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send real email. Check your EMAIL_USER and EMAIL_PASS App Password in .env:', error);
    return false;
  }
};
