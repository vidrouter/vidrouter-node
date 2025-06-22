// Main SDK exports
export {
  parseDuration,
  validateGenerationRequest,
  VidRouter,
  VidRouterAuthenticationError,
  VidRouterError,
  VidRouterRateLimitError,
} from "./client.js";

// Export all types
export type {
  ActivityDetail,
  ActivityFilters,
  ActivityItem,
  ActivityResponse,
  ActivityStats,
  ActivitySummary,
  CreditsData,
  CreditsResponse,
  GenerationJob,
  GenerationRequest,
  GenerationResponse,
  Model,
  PollOptions,
  RequestOptions,
  VidRouterConfig,
} from "./client.js";

// Keep webhooks utilities and types
export { createWebhookVerifier, validateWebhook } from "./webhooks.js";
export type { WebhookEvent, WebhookVerifierConfig } from "./webhooks.js";

// Default export for convenience
import { VidRouter } from "./client.js";
export default VidRouter;
