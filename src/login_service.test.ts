import { loginRequest } from "./login_service.js";

const parsed = loginRequest.safeParse({ phone: "+14155550123", code: "123456" });
if (!parsed.success || parsed.data.code !== "123456") throw new Error("valid login request should pass");
const rejected = loginRequest.safeParse({ phone: "123", code: "12" });
if (rejected.success) throw new Error("short phone and code must be rejected");
console.log("login request boundary: pass");
