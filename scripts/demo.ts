import { beginLogin, verifyLogin } from "../src/login_service.js";

const phone = process.env.DEMO_PHONE;
if (!phone) throw new Error("Set DEMO_PHONE before running the demo");
const sent = await beginLogin({ phone });
console.log("build event: code sent", sent.state);
const code = process.env.DEMO_CODE;
if (code) console.log("release event: login verified", (await verifyLogin({ phone, code })).state);
else console.log("Enter the SMS code as DEMO_CODE and run again to verify.");
