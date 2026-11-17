import { Resend } from 'resend';
import 'dotenv/config';

// Initialize Resend with the API key from environment variables
export const resend = new Resend(process.env.EMAIL_API_KEY);

export const sendVerificationEmail = async (email: string, otp: string) => {
  try {
    console.log(`\n=========================================`);
    console.log(`=========================================\n`);

    const response = await resend.emails.send({
      from: 'Abhyas <noreply@karanop.in>', // If unverified, Resend will return an error
      to: email,
      subject: 'Verify your email - Abhyas',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Welcome to Abhyas!</h2>
          <p style="color: #555; text-align: center; font-size: 16px;">Here is your verification code. Please enter it to complete your registration.</p>
          <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111;">${otp}</span>
          </div>
          <p style="color: #777; font-size: 12px; text-align: center;">This code will expire in 15 minutes.</p>
        </div>
      `,
    });

    if (response.error) {
      console.error("Resend API Error:", response.error);
      throw new Error(response.error.message);
    }

    console.log("Verification email sent successfully:", response.data);
    return response;
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

export const sendClassroomInviteEmail = async (email: string, code: string, classroomName: string) => {
  try {
    const response = await resend.emails.send({
      from: 'Abhyas <noreply@karanop.in>',
      to: email,
      subject: `You've been invited to join ${classroomName} - Abhyas`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Classroom Invite</h2>
          <p style="color: #555; text-align: center; font-size: 16px;">You've been invited to join <strong>${classroomName}</strong>. Use the code below to join — it can only be used once.</p>
          <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111;">${code}</span>
          </div>
          <p style="color: #777; font-size: 12px; text-align: center;">This invite will expire in 7 days.</p>
        </div>
      `,
    });

    if (response.error) {
      console.error("Resend API Error (Classroom Invite):", response.error);
      throw new Error(response.error.message);
    }

    console.log("Classroom invite email sent successfully:", response.data);
    return response;
  } catch (error) {
    console.error("Error sending classroom invite email:", error);
    throw error;
  }
};

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const sendOrganisationInviteEmail = async (email: string, organisationName: string, inviterName: string | null, link: string) => {
  try {
    const org = escapeHtml(organisationName);
    const who = inviterName ? `${escapeHtml(inviterName)} has invited you` : "You have been invited";
    const response = await resend.emails.send({
      from: 'Abhyas <noreply@karanop.in>',
      to: email,
      subject: `${organisationName} invited you to join as a teacher - Abhyas`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">You're invited to ${org}</h2>
          <p style="color: #555; text-align: center; font-size: 16px;">${who} to join <strong>${org}</strong> on Abhyas as a teacher.</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${link}" style="background-color: #f26a1b; color: #fff; text-decoration: none; font-weight: bold; padding: 12px 28px; border-radius: 999px; display: inline-block;">View invitation</a>
          </div>
          <p style="color: #777; font-size: 12px; text-align: center;">You can accept or decline on the next page. This invitation expires in 7 days. If you were not expecting it, you can ignore this email.</p>
        </div>
      `,
    });

    if (response.error) {
      console.error("Resend API Error (Organisation Invite):", response.error);
      throw new Error(response.error.message);
    }
    return response;
  } catch (error) {
    console.error("Error sending organisation invite email:", error);
    throw error;
  }
};

export const sendResetPasswordEmail = async (email: string, otp: string) => {
  try {
    console.log(`\n=========================================`);
    console.log(`🔑 DEVELOPMENT PASSWORD RESET OTP FOR ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`=========================================\n`);

    const response = await resend.emails.send({
      from: 'Abhyas <noreply@karanop.in>',
      to: email,
      subject: 'Reset Your Password - Abhyas',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Password Reset</h2>
          <p style="color: #555; text-align: center; font-size: 16px;">You requested to reset your password. Please use the following code to reset it.</p>
          <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111;">${otp}</span>
          </div>
          <p style="color: #777; font-size: 12px; text-align: center;">This code will expire in 15 minutes.</p>
        </div>
      `,
    });

    if (response.error) {
      console.error("Resend API Error (Reset Password):", response.error);
      throw new Error(response.error.message);
    }

    console.log("Reset password email sent successfully:", response.data);
    return response;
  } catch (error) {
    console.error("Error sending reset password email:", error);
    throw error;
  }
};
