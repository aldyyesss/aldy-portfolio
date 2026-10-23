import { config } from "../config";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// Use the documented REST interfaces. Secret keys never leave this backend.
export async function supabase<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
  publicRequest = false,
): Promise<T> {
  const key = publicRequest ? config.publicKey : config.secret;
  if (!config.url || !key)
    throw new ApiError(
      503,
      "Supabase is not configured. Check the backend environment.",
    );
  const headers = new Headers(options.headers);
  headers.set("apikey", key);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  else if (key.startsWith("eyJ")) headers.set("Authorization", `Bearer ${key}`);
  // Modern sb_secret keys belong in apikey, never in the bearer JWT header.
  if (options.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(`${config.url}${path}`, {
      ...options,
      headers,
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new ApiError(503, "Supabase could not be reached. Please try again.");
  }
  if (!response.ok) {
    // Do not forward provider payloads, URLs, or credentials to the browser.
    if (response.status === 401 || response.status === 403)
      throw new ApiError(
        response.status,
        "Your session is invalid or access is not allowed.",
      );
    if (response.status === 400)
      throw new ApiError(400, "The request was rejected by Supabase.");
    if (response.status === 409)
      throw new ApiError(409, "This record already exists.");
    if (response.status === 429)
      throw new ApiError(429, "Too many attempts. Please try again later.");
    throw new ApiError(
      503,
      "Supabase could not complete this request. Check the schema and storage setup.",
    );
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
