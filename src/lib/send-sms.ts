import axios from "axios";
import { env } from "@/lib/env";

interface SendSMSOptions {
  to: string | string[];
  message: string;
}

/**
 * Send an SMS via the bulk SMS provider configured in env.
 *
 * All credentials/URLs are read from the typed env loader (BULK_API_URL,
 * BULK_API_KEY, BULK_SENDER_ID) so the same code serves any deployment.
 * The legacy NEXT_PUBLIC_BULK_* keys are intentionally NOT read here — see
 * the multi-tenant plan for the rename.
 */
export const sendSMS = async ({ to, message }: SendSMSOptions) => {
  try {
    if (!env.BULK_API_URL || !env.BULK_API_KEY || !env.BULK_SENDER_ID) {
      throw new Error(
        "SMS credentials are not configured (BULK_API_URL / BULK_API_KEY / BULK_SENDER_ID).",
      );
    }

    const numbers = Array.isArray(to) ? to.join(",") : to;

    const response = await axios.post(env.BULK_API_URL, null, {
      params: {
        api_key: env.BULK_API_KEY,
        senderid: env.BULK_SENDER_ID,
        number: numbers,
        message,
      },
    });

    if (response.data.response_code === "SUCCESS") {
      console.log(`SMS sent successfully to ${numbers}`);
    } else {
      console.error(`SMS failed:`, response.data);
    }

    return response.data;
  } catch (error) {
    console.error("SMS send error:", error);
    throw error;
  }
};
