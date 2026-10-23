import { config } from "../config";
import { supabase, ApiError } from "./supabase";

interface AuthUser {
  id: string;
  email?: string;
  email_confirmed_at?: string;
}
export const auth = {
  async verify(token: string): Promise<AuthUser> {
    if (!token) throw new ApiError(401, "Sign in to the admin dashboard.");
    const user = await supabase<AuthUser>("/auth/v1/user", {}, token, true);
    if (
      !user.id ||
      !user.email_confirmed_at ||
      user.email?.toLowerCase() !== config.adminEmail
    )
      throw new ApiError(403, "This account does not have admin access.");
    return user;
  },
  async login(email: string, password: string) {
    if (email.trim().toLowerCase() !== config.adminEmail)
      throw new ApiError(401, "The email or password is incorrect.");
    let session: { access_token: string; expires_in: number; user: AuthUser };
    try {
      session = await supabase(
        "/auth/v1/token?grant_type=password",
        { method: "POST", body: JSON.stringify({ email, password }) },
        undefined,
        true,
      );
    } catch (error) {
      if (
        error instanceof ApiError &&
        (error.status === 400 || error.status === 401 || error.status === 403)
      )
        throw new ApiError(401, "The email or password is incorrect.");
      throw error;
    }
    await this.verify(session.access_token);
    return { token: session.access_token, expiresIn: session.expires_in };
  },
  async logout(token: string) {
    await supabase(
      "/auth/v1/logout?scope=local",
      { method: "POST" },
      token,
      true,
    );
  },
};
