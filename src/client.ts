// VidRouter SDK Client - Based on unified API client

// ===== TYPES AND INTERFACES =====

// Configuration
export interface VidRouterConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  userAgent?: string;
}

// Generation types
export interface GenerationRequest {
  model: string;
  prompt: string;
  duration_seconds: number;
  aspect_ratio: string;
  negative_prompt?: string;
  input_image?: string;
  input_video?: string;
  seed?: number;
  webhook_url?: string;
  metadata?: Record<string, any>;
}

export interface GenerationResponse {
  id: string;
  status: string;
  progress: number;
  model: string;
  prompt: string;
  cost_usd: number;
  provider: string;
  created_at: string;
  output_url?: string;
  error_message?: string;
}

export interface GenerationJob {
  id: string;
  status: string;
  progress: number;
  model: string;
  prompt: string;
  negative_prompt?: string;
  input_video_url?: string;
  input_image_url?: string;
  duration_seconds?: number;
  aspect_ratio?: string;
  seed?: number;
  webhook_url?: string;
  metadata?: Record<string, any>;
  provider: string;
  output_url?: string;
  cost_usd: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  queued_at: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
}

// Activity types
export interface ActivityItem {
  id: string;
  type: string;
  status: string;
  model: string;
  prompt: string;
  progress: number;
  duration_seconds?: number;
  aspect_ratio?: string;
  provider: string;
  output_url?: string;
  cost_usd?: number;
  api_key_name?: string;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  failed_at?: string;
  processing_duration_seconds?: number;
}

export interface ActivitySummary {
  total_jobs: number;
  total_spent_usd: number;
  jobs_by_status: Record<string, number>;
}

export interface ActivityResponse {
  activity: ActivityItem[];
  summary: ActivitySummary;
  pagination: {
    has_more: boolean;
    next_cursor?: string;
    limit: number;
  };
}

export interface ActivityStats {
  period_days: number;
  total_jobs: number;
  recent_jobs: number;
  total_spent_usd: number;
  recent_spent_usd: number;
  average_processing_time_seconds?: number;
  jobs_by_status: Record<string, number>;
  top_models: Array<{
    model: string;
    count: number;
  }>;
}

export interface ActivityDetail extends ActivityItem {
  negative_prompt?: string;
  input_video_url?: string;
  input_image_url?: string;
  seed?: number;
  webhook_url?: string;
  metadata?: Record<string, any>;
  provider_job_id?: string;
  api_key_prefix?: string;
  retry_count: number;
  updated_at: string;
  queued_at: string;
  queue_duration_seconds?: number;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    description?: string;
    created_at: string;
  }>;
  webhook_logs: Array<{
    id: string;
    url: string;
    status: string;
    attempt: number;
    response_code?: number;
    created_at: string;
  }>;
}

export interface ActivityFilters {
  cursor?: string;
  limit?: number;
  status?: string;
  model?: string;
  from_date?: string;
  to_date?: string;
}

// Credits types
export interface CreditsData {
  total_credits: number;
  total_usage: number;
  current_balance: number;
  currency: string;
}

export interface CreditsResponse {
  data: CreditsData;
}

// Model types
export interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: string[];
  max_duration_seconds: number;
  supported_aspect_ratios: string[];
  price_per_second_usd: number;
  preview_url?: string;
}

// Error response type (RFC 9457-inspired)
export interface ApiErrorResponse {
  status: number;
  title: string;
  detail?: string;
  type: string;
}

// Error classes
export class VidRouterError extends Error {
  public readonly status: number;
  public readonly title: string;
  public readonly detail?: string;
  public readonly type: string;

  constructor(
    status: number,
    title: string,
    detail?: string,
    type: string = "about:blank"
  ) {
    super(detail ?? title);
    this.name = "VidRouterError";
    this.status = status;
    this.title = title;
    this.detail = detail ?? "";
    this.type = type;
  }

  static fromApiResponse(response: ApiErrorResponse): VidRouterError {
    return new VidRouterError(
      response.status,
      response.title,
      response.detail || undefined,
      response.type
    );
  }
}

export class VidRouterAuthenticationError extends VidRouterError {
  constructor(title: string = "Unauthorized", detail?: string) {
    super(401, title, detail, "https://vidrouter.com/errors/unauthorized");
    this.name = "VidRouterAuthenticationError";
  }
}

export class VidRouterRateLimitError extends VidRouterError {
  constructor(title: string = "Rate Limit Exceeded", detail?: string) {
    super(429, title, detail, "https://vidrouter.com/errors/rate-limit");
    this.name = "VidRouterRateLimitError";
  }
}

export class VidRouterValidationError extends VidRouterError {
  constructor(title: string = "Validation Error", detail?: string) {
    super(422, title, detail, "https://vidrouter.com/errors/validation-error");
    this.name = "VidRouterValidationError";
  }
}

export class VidRouterNotFoundError extends VidRouterError {
  constructor(title: string = "Not Found", detail?: string) {
    super(404, title, detail, "https://vidrouter.com/errors/not-found");
    this.name = "VidRouterNotFoundError";
  }
}

export class VidRouterInsufficientCreditsError extends VidRouterError {
  constructor(title: string = "Insufficient Credits", detail?: string) {
    super(
      402,
      title,
      detail,
      "https://vidrouter.com/errors/insufficient-credits"
    );
    this.name = "VidRouterInsufficientCreditsError";
  }
}

// Polling options
export interface PollOptions {
  maxAttempts?: number;
  intervalMs?: number;
  onProgress?: (job: GenerationJob) => void;
}

// Request options
export interface RequestOptions {
  timeout?: number;
  signal?: AbortSignal;
}

// ===== MAIN SDK CLIENT =====

// Polyfill for fetch (Node.js compatibility)
const globalFetch = (() => {
  if (typeof globalThis !== "undefined" && globalThis.fetch) {
    return globalThis.fetch;
  }
  if (typeof window !== "undefined" && window.fetch) {
    return window.fetch;
  }
  // For Node.js environments
  try {
    return require("cross-fetch");
  } catch {
    throw new VidRouterError(
      500,
      "Configuration Error",
      'No fetch implementation found. Please install "cross-fetch" for Node.js environments.'
    );
  }
})();

export class VidRouter {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly userAgent: string;

  constructor(config: VidRouterConfig | string) {
    if (typeof config === "string") {
      this.apiKey = config;
      this.baseUrl = "https://api.vidrouter.com";
      this.timeout = 30000;
      this.userAgent = "vidrouter-sdk-js/1.0.0";
    } else {
      this.apiKey = config.apiKey;
      this.baseUrl = config.baseUrl || "https://api.vidrouter.com";
      this.timeout = config.timeout || 30000;
      this.userAgent = config.userAgent || "vidrouter-sdk-js/1.0.0";
    }

    if (!this.apiKey) {
      throw new VidRouterError(
        400,
        "Configuration Error",
        "API key is required"
      );
    }

    if (!this.apiKey.startsWith("vr_")) {
      throw new VidRouterError(
        400,
        "Configuration Error",
        'Invalid API key format. API key should start with "vr_"'
      );
    }
  }

  // ===== SHARED REQUEST METHOD =====

  private async request<T>(
    endpoint: string,
    options: RequestInit & RequestOptions = {}
  ): Promise<T> {
    const { timeout = this.timeout, signal, ...fetchOptions } = options;
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      "User-Agent": this.userAgent,
      ...(fetchOptions.headers as Record<string, string>),
    };

    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    const requestSignal = signal || controller.signal;

    try {
      const response = await globalFetch(url, {
        ...fetchOptions,
        headers,
        signal: requestSignal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        await this.handleErrorResponse(response);
      }

      // Handle empty responses
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return {} as T;
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);

      if (error instanceof VidRouterError) {
        throw error;
      }

      if (error.name === "AbortError") {
        throw new VidRouterError(408, "Request Timeout", "Request timeout");
      }

      throw new VidRouterError(
        500,
        "Network Error",
        `Network error: ${error.message}`
      );
    }
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: ApiErrorResponse | any = {};

    try {
      errorData = await response.json();
    } catch {
      // Ignore JSON parsing errors - create fallback error response
      errorData = {
        status: response.status,
        title: response.statusText || "Unknown Error",
        detail: `HTTP ${response.status}`,
        type: "about:blank",
      };
    }

    // If the response matches our new error format, use it directly
    if (errorData.status && errorData.title) {
      switch (errorData.status) {
        case 401:
          throw new VidRouterAuthenticationError(
            errorData.title,
            errorData.detail
          );
        case 429:
          throw new VidRouterRateLimitError(errorData.title, errorData.detail);
        case 422:
          throw new VidRouterValidationError(errorData.title, errorData.detail);
        case 404:
          throw new VidRouterNotFoundError(errorData.title, errorData.detail);
        case 402:
          throw new VidRouterInsufficientCreditsError(
            errorData.title,
            errorData.detail
          );
        default:
          throw VidRouterError.fromApiResponse(errorData);
      }
    }

    // Fallback for legacy error format
    const message =
      errorData.message ||
      errorData.detail ||
      `HTTP ${response.status}: ${response.statusText}`;

    switch (response.status) {
      case 401:
        throw new VidRouterAuthenticationError("Unauthorized", message);
      case 429:
        throw new VidRouterRateLimitError("Rate Limit Exceeded", message);
      case 422:
        throw new VidRouterValidationError("Validation Error", message);
      case 404:
        throw new VidRouterNotFoundError("Not Found", message);
      case 402:
        throw new VidRouterInsufficientCreditsError(
          "Insufficient Credits",
          message
        );
      case 400:
        throw new VidRouterError(
          400,
          "Bad Request",
          message || "Invalid request. Please check your input and try again."
        );
      case 500:
      case 502:
      case 503:
      case 504:
        throw new VidRouterError(
          response.status,
          "Server Error",
          "Server error. Please try again later."
        );
      default:
        throw new VidRouterError(response.status, "Unknown Error", message);
    }
  }

  // ===== MODEL METHODS =====

  /**
   * List available video generation models
   */
  async getModels(): Promise<Model[]> {
    return this.request<Model[]>("/v1/models");
  }

  // ===== GENERATION METHODS =====

  /**
   * Create a new video generation job
   */
  async createGeneration(
    request: GenerationRequest,
    options?: RequestOptions
  ): Promise<GenerationResponse> {
    return this.request<GenerationResponse>("/v1/generations", {
      method: "POST",
      body: JSON.stringify(request),
      ...options,
    });
  }

  /**
   * Get a specific generation job by ID
   */
  async getGeneration(
    jobId: string,
    options?: RequestOptions
  ): Promise<GenerationJob> {
    return this.request<GenerationJob>(`/v1/generations/${jobId}`, {
      method: "GET",
      ...options,
    });
  }

  /**
   * List all generations for the user
   */
  async listGenerations(
    params?: { limit?: number; cursor?: string },
    options?: RequestOptions
  ): Promise<{
    jobs: GenerationJob[];
    has_more: boolean;
    next_cursor?: string;
  }> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.cursor) searchParams.set("cursor", params.cursor);

    const query = searchParams.toString();
    const endpoint = `/v1/generations${query ? `?${query}` : ""}`;

    return this.request(endpoint, { method: "GET", ...options });
  }

  /**
   * Delete a specific generation job
   */
  async deleteGeneration(
    jobId: string,
    options?: RequestOptions
  ): Promise<{ message: string; deleted_job_id: string }> {
    return this.request(`/v1/generations/${jobId}`, {
      method: "DELETE",
      ...options,
    });
  }

  /**
   * Poll for job status until completion
   */
  async pollJobStatus(
    jobId: string,
    pollOptions: PollOptions = {},
    requestOptions?: RequestOptions
  ): Promise<GenerationJob> {
    const {
      maxAttempts = 120, // 10 minutes total (120 * 5s = 600s)
      intervalMs = 5000,
      onProgress,
    } = pollOptions;

    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const job = await this.getGeneration(jobId, requestOptions);

        if (onProgress) {
          onProgress(job);
        }

        // Check if job is complete
        if (job.status === "COMPLETED") {
          return job;
        }

        if (job.status === "FAILED") {
          throw new VidRouterError(
            400,
            "Generation Failed",
            job.error_message || "Video generation failed"
          );
        }

        // Wait before next poll
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        attempts++;
      } catch (error) {
        if (attempts >= maxAttempts - 1) {
          throw error;
        }
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        attempts++;
      }
    }

    throw new VidRouterError(
      408,
      "Polling Timeout",
      "Polling timeout: Video generation took too long"
    );
  }

  /**
   * Generate video and wait for completion (convenience method)
   */
  async generateVideo(
    request: GenerationRequest,
    pollOptions?: PollOptions,
    requestOptions?: RequestOptions
  ): Promise<GenerationJob> {
    const response = await this.createGeneration(request, requestOptions);
    return this.pollJobStatus(response.id, pollOptions, requestOptions);
  }

  // ===== ACTIVITY METHODS =====

  /**
   * Get activity with optional filtering and pagination
   */
  async getActivity(
    filters?: ActivityFilters,
    options?: RequestOptions
  ): Promise<ActivityResponse> {
    const searchParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/v1/activity${queryString ? `?${queryString}` : ""}`;

    return this.request<ActivityResponse>(endpoint, {
      method: "GET",
      ...options,
    });
  }

  /**
   * Get activity statistics for a specific time period
   */
  async getActivityStats(
    days: number = 30,
    options?: RequestOptions
  ): Promise<ActivityStats> {
    return this.request<ActivityStats>(`/v1/activity/stats?days=${days}`, {
      method: "GET",
      ...options,
    });
  }

  /**
   * Get detailed activity information for a specific job
   */
  async getActivityDetail(
    jobId: string,
    options?: RequestOptions
  ): Promise<ActivityDetail> {
    return this.request<ActivityDetail>(`/v1/activity/${jobId}`, {
      method: "GET",
      ...options,
    });
  }

  // ===== CREDITS METHODS =====

  /**
   * Get credits information for the user
   */
  async getCredits(options?: RequestOptions): Promise<CreditsData> {
    const response = await this.request<CreditsResponse>("/v1/credits", {
      method: "GET",
      ...options,
    });
    return response.data;
  }

  // ===== UTILITY METHODS =====

  /**
   * Get API key prefix for debugging
   */
  getApiKeyPrefix(): string {
    return this.apiKey.slice(0, 10) + "...";
  }

  /**
   * Get SDK version
   */
  static getVersion(): string {
    return "1.1.0";
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Helper function to convert duration string to number
 */
export function parseDuration(duration: string): number {
  return parseInt(duration.replace("s", ""), 10);
}

/**
 * Helper function to validate generation request
 */
export function validateGenerationRequest(
  request: Partial<GenerationRequest>
): string[] {
  const errors: string[] = [];

  if (!request.prompt?.trim()) {
    errors.push("Prompt is required");
  }

  if (!request.model) {
    errors.push("Model is required");
  }

  if (
    !request.duration_seconds ||
    request.duration_seconds < 1 ||
    request.duration_seconds > 8
  ) {
    errors.push("Duration must be between 1 and 8 seconds");
  }

  if (
    !request.aspect_ratio ||
    !["16:9", "9:16", "1:1"].includes(request.aspect_ratio)
  ) {
    errors.push("Aspect ratio must be 16:9, 9:16, or 1:1");
  }

  return errors;
}
