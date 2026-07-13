/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from "fs";
import * as path from "path";
import nodemailer from "nodemailer";
import Handlebars from "handlebars";
import { env, publicEnv } from "@/lib/env";

const ReadFile = fs.promises.readFile;

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    encoding?: string;
    contentType?: string;
  }>;
}

interface EmailTemplate {
  compile: (data: any) => string;
}

// Cache for compiled templates
const templateCache = new Map<string, EmailTemplate>();

/**
 * Send a transactional email using the credentials in env.APP_EMAIL / env.APP_PASS.
 * The brand name (used in the default `from:` display name) and APP_URL come
 * from the multi-tenant siteConfig so the same code serves any deployment.
 *
 * Per the multi-tenant plan, callers pass `brandName` (read from `getSiteConfig()`
 * at the API edge) instead of hardcoding "Elham Books" / "Madrasah Association".
 */
export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  template,
  templateData = {},
  attachments = [],
  brandName,
}: SendEmailOptions & { brandName?: string }) => {
  try {
    if (!env.APP_EMAIL || !env.APP_PASS) {
      throw new Error("Email credentials are not configured");
    }

    const transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(env.EMAIL_PORT || "587", 10),
      secure: env.NODE_ENV === "production",
      auth: {
        user: env.APP_EMAIL,
        pass: env.APP_PASS,
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });

    await transporter.verify();

    let finalHtml = html;

    if (template && !html) {
      finalHtml = await compileTemplate(template, templateData);
    }

    if (!finalHtml && text) {
      finalHtml = `<pre style="font-family: sans-serif;">${text}</pre>`;
    }

    const fromName = brandName || publicEnv.NEXT_PUBLIC_BRAND_NAME || "Store";

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${fromName}" <${env.APP_EMAIL}>`,
      to: Array.isArray(to) ? to.join(",") : to,
      subject,
      text: text || (finalHtml ? stripHtml(finalHtml) : ""),
      html: finalHtml,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);

    return info;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error(
      `Email sending failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
};

// Helper function to compile email templates
export const compileTemplate = async (
  templateName: string,
  data: Record<string, any> = {},
): Promise<string> => {
  try {
    if (templateCache.has(templateName)) {
      const template = templateCache.get(templateName)!;
      return template.compile(data);
    }

    const templatesDir = path.join(process.cwd(), "src", "templates", "emails");
    const templatePath = path.join(templatesDir, `${templateName}.hbs`);

    const templateContent = await ReadFile(templatePath, "utf-8");
    const template = Handlebars.compile(templateContent);

    templateCache.set(templateName, { compile: template });

    return template(data);
  } catch (error) {
    console.error(`Failed to compile template ${templateName}:`, error);
    throw new Error(
      `Template compilation failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
};

// Helper function to strip HTML tags for text fallback
const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>/g, "");
};

// Predefined email templates for common use cases.
// `brandName` resolves from `getSiteConfig()` at the API edge so subjects like
// "Welcome to <brand>" stay aligned with whichever tenant is deploying this build.
export const EmailTemplates = {
  sendOtpEmail: async (
    to: string,
    otp: string,
    userName?: string,
    brandName?: string,
  ) => {
    const brand = brandName || publicEnv.NEXT_PUBLIC_BRAND_NAME || "Store";
    return sendEmail({
      to,
      subject: `Your Verification Code - ${brand}`,
      template: "otp-verification",
      templateData: {
        otp,
        userName: userName || "User",
        expiryTime: "15 minutes",
        supportEmail: env.SUPPORT_EMAIL,
        brandName: brand,
      },
      brandName: brand,
    });
  },

  sendWelcomeEmail: async (
    to: string,
    userName: string,
    brandName?: string,
  ) => {
    const brand = brandName || publicEnv.NEXT_PUBLIC_BRAND_NAME || "Store";
    return sendEmail({
      to,
      subject: `Welcome to ${brand}`,
      template: "welcome",
      templateData: {
        userName,
        loginUrl: `${env.APP_URL}/login`,
        supportEmail: env.SUPPORT_EMAIL,
        brandName: brand,
      },
      brandName: brand,
    });
  },

  sendPasswordResetEmail: async (
    to: string,
    resetToken: string,
    userName?: string,
    brandName?: string,
  ) => {
    const brand = brandName || publicEnv.NEXT_PUBLIC_BRAND_NAME || "Store";
    const resetUrl = `${env.APP_URL}/reset-password?token=${resetToken}`;

    return sendEmail({
      to,
      subject: `Password Reset Request - ${brand}`,
      template: "password-reset",
      templateData: {
        userName: userName || "User",
        resetUrl,
        expiryTime: "1 hour",
        supportEmail: env.SUPPORT_EMAIL,
        brandName: brand,
      },
      brandName: brand,
    });
  },

  sendNotificationEmail: async (
    to: string,
    title: string,
    message: string,
    userName?: string,
    brandName?: string,
  ) => {
    const brand = brandName || publicEnv.NEXT_PUBLIC_BRAND_NAME || "Store";
    return sendEmail({
      to,
      subject: title,
      template: "notification",
      templateData: {
        userName: userName || "User",
        title,
        message,
        appUrl: env.APP_URL,
        supportEmail: env.SUPPORT_EMAIL,
        brandName: brand,
      },
      brandName: brand,
    });
  },
};
