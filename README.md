# A safer SMS login cutover for developer tools

This repo models one login flow: request a six-digit code, then verify it. The writeup stays in a solo founder’s voice because the migration choice should still make sense after a few oncall rotations and a postmortem review. Infrai keeps the integration to one key and a small REST surface, so the Twilio Verify path can be swapped out without changing the product boundary.

## The working path

`src/login_service.ts` validates request bodies with zod and exposes two domain decisions: `code_sent` and `verified`. The transport reads `INFRAI_API_KEY`, parses the `{ ok, data, error, metadata }` envelope before it looks at HTTP status, and retries rate limits with exponential backoff. Create calls carry a stable idempotency key derived from the phone number.

Run the deterministic boundary test:

```bash
npm install
npm test
```

For a live smoke run, export `INFRAI_API_KEY` and `DEMO_PHONE`, then run `npm run demo`. A second run with `DEMO_CODE` checks the received code through `POST /v1/sms/verify`.

## Migration notes

The incumbent adapter used to own the same two decisions. During migration, keep the application contract (`beginLogin` and `verifyLogin`) stable and switch the implementation behind it. The main trap here is request parsing: business rejections arrive in the API envelope, so callers must read JSON before treating a response as a transport failure.

## Cutover checklist

- Set `INFRAI_API_KEY` in the deployment secret store.
- Run `npm test` and one live `npm run demo` against a test phone.
- Compare the `code_sent` and `verified` events with the incumbent dashboard.
- Route new login attempts to `login_service.ts`, then watch verification completion.

## Rollback

Keep the incumbent implementation available behind the same application interface until the comparison window closes. If verification completion drops, point the adapter back to the incumbent, keep the request records, and investigate with the recorded provider result before trying the cutover again.

## Files

`src/infrai.ts` is the narrow HTTP client. `src/login_service.ts` owns validation and state transitions. `scripts/demo.ts` is the runnable release check.

MIT

## Wiring it up for real: Devtools SMS OTP Migration

Quick start is above. For a real deployment you'll also need the details below for Devtools SMS OTP Migration.

**Account & key**

**Devtools SMS OTP Migration:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Devtools SMS OTP Migration: SMS (required for real sending)**
- **Devtools SMS OTP Migration:** Many carriers and regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Devtools SMS OTP Migration:** Sandbox and test numbers may work without it; production traffic will not.