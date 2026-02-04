import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
const smtpUser = process.env.SMTP_USER;
const smtpPassword = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
const smtpSecure = process.env.SMTP_SECURE === 'true';
const fromName = process.env.SMTP_FROM_NAME || 'Unify';
const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.FROM_EMAIL || `no-reply@${process.env.NEXTAUTH_URL?.replace(/^https?:\/\//, '') || 'unify.local'}`;

let transporter: Transporter | null = null;

function createTransport() {
  if (!smtpHost || !smtpPort || !smtpUser || !smtpPassword) {
    throw new Error(
      'SMTP configuration is incomplete. Please set: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD'
    );
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure || smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });
}

function getTransporter() {
  if (!transporter) {
    transporter = createTransport();
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string, text?: string) {
  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html,
    });
    console.log(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
}

export async function sendVerificationCodeEmail(to: string, code: string) {
  const subject = 'Votre code de vérification - Unify';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Vérification de votre compte</h2>
      <p>Votre code de vérification est :</p>
      <p style="font-size: 32px; font-weight: bold; color: #007bff; text-align: center; letter-spacing: 5px;">
        ${code}
      </p>
      <p>Ce code expire dans 1 heure.</p>
      <p style="color: #666; font-size: 12px;">
        Si vous n'avez pas demandé cette vérification, ignorez cet email.
      </p>
    </div>
  `;
  const text = `Votre code de vérification: ${code}. Il expire dans 1 heure.`;
  return sendEmail(to, subject, html, text);
}

export async function sendResetCodeEmail(to: string, code: string) {
  const subject = 'Réinitialiser votre mot de passe - Unify';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Réinitialisation du mot de passe</h2>
      <p>Vous avez demandé une réinitialisation de mot de passe.</p>
      <p>Votre code de réinitialisation est :</p>
      <p style="font-size: 32px; font-weight: bold; color: #007bff; text-align: center; letter-spacing: 5px;">
        ${code}
      </p>
      <p>Ce code expire dans 1 heure.</p>
      <p style="color: #666; font-size: 12px;">
        Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
      </p>
    </div>
  `;
  const text = `Code de réinitialisation: ${code}. Il expire dans 1 heure.`;
  return sendEmail(to, subject, html, text);
}

export async function sendWelcomeEmail(to: string, userName: string) {
  const subject = 'Bienvenue sur Unify!';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Bienvenue, ${userName}!</h2>
      <p>Votre compte a été créé avec succès. Vous pouvez maintenant accéder à Unify.</p>
      <p style="margin-top: 30px;">
        <a href="${process.env.NEXTAUTH_URL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Se connecter à Unify
        </a>
      </p>
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        Questions? Rendez-vous sur notre page d'aide.
      </p>
    </div>
  `;
  const text = `Bienvenue ${userName}! Vous pouvez maintenant accéder à Unify.`;
  return sendEmail(to, subject, html, text);
}

export async function sendNotificationEmail(to: string, title: string, message: string) {
  const subject = `Nouvelle notification - ${title}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${title}</h2>
      <p>${message}</p>
      <p style="margin-top: 30px;">
        <a href="${process.env.NEXTAUTH_URL}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Voir dans Unify
        </a>
      </p>
    </div>
  `;
  const text = `${title}: ${message}`;
  return sendEmail(to, subject, html, text);
}

export async function verifySmtpConnection(): Promise<boolean> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('✗ SMTP connection failed:', error);
    return false;
  }
}
