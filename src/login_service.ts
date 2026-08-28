import { z } from "zod";
import { infrai } from "./infrai.js";

export const loginRequest = z.object({ phone: z.string().min(7), code: z.string().regex(/^\d{6}$/).optional() });
export type LoginRequest = z.infer<typeof loginRequest>;

export async function beginLogin(input: unknown) {
  const request = loginRequest.omit({ code: true }).parse(input);
  const result = await infrai.sms.otp({ to: request.phone, phone: request.phone }, `login-${request.phone}`);
  return { state: "code_sent" as const, phone: request.phone, provider: result };
}

export async function verifyLogin(input: unknown) {
  const request = loginRequest.required().parse(input);
  const result = await infrai.sms.verify({ to: request.phone, phone: request.phone, code: request.code });
  return { state: "verified" as const, phone: request.phone, provider: result };
}
