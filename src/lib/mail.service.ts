import nodemailer from "nodemailer";
import { google } from "googleapis";

// Define strict environments
const SMTP_USER = process.env.SMTP_USER;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3001";

// Ensure environments exist before proceeding
if (!SMTP_USER || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
  throw new Error("Missing required exact environment variables for the mail service (SMTP_USER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN).");
}

const OAuth2 = google.auth.OAuth2;

/**
 * Create a new OAuth2 client using the environment variables
 */
const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground" // standard OAuth playground redirect URI for generated refresh tokens
  );

  oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN,
  });

  // Geth the access token dynamically
  const accessTokenObject = await oauth2Client.getAccessToken();
  const accessToken = accessTokenObject?.token || "";

  if (!accessToken) {
    throw new Error("Could not retrieve access token for mailing service.");
  }

  // Create standard nodemailer transporter config
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: SMTP_USER,
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken: GOOGLE_REFRESH_TOKEN,
      accessToken,
    },
  });
};

interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send a generic HTML email
 */
export const sendMail = async ({ to, subject, html }: MailOptions): Promise<void> => {
  try {
    const transporter = await createTransporter();
    
    await transporter.sendMail({
      from: `"GameFlow AutoPilot" <${SMTP_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Failed to send email: ", error);
    throw new Error("Could not send email.");
  }
};

/**
 * Send an account verification email specifically
 */
export const sendVerificationEmail = async (email: string, verifyUrl: string): Promise<void> => {
  const fullVerifyUrl = `${APP_BASE_URL}${verifyUrl}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
      <h2 style="color: #333; text-align: center;">Welcome to GameFlow AutoPilot</h2>
      <p style="color: #555; line-height: 1.6;">
        Hello, <br/><br/>
        You have successfully registered an account. To complete setting up your automation workspace, please verify your email address by clicking the button below:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${fullVerifyUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">
          Verify My Email
        </a>
      </div>
      <p style="color: #777; font-size: 14px; text-align: center;">
        If you did not request this, please ignore this email. This link will expire shortly.
      </p>
      <hr style="border: none; border-top: 1px solid #eaeaea; margin: 30px 0;" />
      <p style="color: #aaa; font-size: 12px; text-align: center;">
        &copy; ${new Date().getFullYear()} GameFlow AutoPilot. All rights reserved.
      </p>
    </div>
  `;

  await sendMail({
    to: email,
    subject: "Verify your email - GameFlow AutoPilot",
    html: htmlContent,
  });
};
