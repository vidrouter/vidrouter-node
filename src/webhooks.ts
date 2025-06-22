import { createHmac, timingSafeEqual } from "crypto";

// Define WebhookEvent type since it's not in the main client
export interface WebhookEvent {
  type: "job.completed" | "job.failed" | "job.cancelled";
  data: {
    id: string;
    status: string;
    progress: number;
    model: string;
    prompt: string;
    output_url?: string;
    error_message?: string;
    created_at: string;
    updated_at: string;
    [key: string]: any;
  };
  timestamp: string;
}

export interface WebhookVerifierConfig {
  secret: string;
  tolerance?: number; // Time tolerance in seconds (default: 300 = 5 minutes)
}

export class WebhookVerifier {
  private readonly secret: string;
  private readonly tolerance: number;

  constructor(config: WebhookVerifierConfig) {
    this.secret = config.secret;
    this.tolerance = config.tolerance ?? 300; // 5 minutes default
  }

  /**
   * Verify a webhook payload and signature
   */
  verify(
    payload: string | Buffer,
    signature: string,
    timestamp?: string
  ): WebhookEvent {
    const payloadString =
      typeof payload === "string" ? payload : payload.toString("utf8");

    // Verify timestamp if provided
    if (timestamp) {
      const timestampNum = parseInt(timestamp, 10);
      const now = Math.floor(Date.now() / 1000);

      if (Math.abs(now - timestampNum) > this.tolerance) {
        throw new Error("Webhook timestamp is too old");
      }
    }

    // Create expected signature
    const payloadToSign = timestamp
      ? `${timestamp}.${payloadString}`
      : payloadString;
    const expectedSignature = createHmac("sha256", this.secret)
      .update(payloadToSign, "utf8")
      .digest("hex");

    // Extract signature from header (format: "sha256=<signature>")
    const actualSignature = signature.startsWith("sha256=")
      ? signature.slice(7)
      : signature;

    // Compare signatures using timing-safe comparison
    if (
      !timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(actualSignature, "hex")
      )
    ) {
      throw new Error("Invalid webhook signature");
    }

    // Parse and return the event
    try {
      return JSON.parse(payloadString) as WebhookEvent;
    } catch (error) {
      throw new Error("Invalid webhook payload JSON");
    }
  }
}

/**
 * Create a webhook verifier instance
 */
export function createWebhookVerifier(
  config: WebhookVerifierConfig
): WebhookVerifier {
  return new WebhookVerifier(config);
}

/**
 * Convenience function to validate a webhook
 */
export function validateWebhook(
  payload: string | Buffer,
  signature: string,
  secret: string,
  timestamp?: string,
  tolerance: number = 300
): WebhookEvent {
  const verifier = new WebhookVerifier({ secret, tolerance });
  return verifier.verify(payload, signature, timestamp);
}

/**
 * Generate a webhook signature (for testing)
 */
export function generateWebhookSignature(
  payload: string,
  secret: string,
  timestamp?: string
): string {
  const payloadToSign = timestamp ? `${timestamp}.${payload}` : payload;
  const signature = createHmac("sha256", secret)
    .update(payloadToSign, "utf8")
    .digest("hex");

  return `sha256=${signature}`;
}
