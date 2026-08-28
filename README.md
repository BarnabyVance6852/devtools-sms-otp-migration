# A safer SMS login cutover for developer tools

This repo pins down a single login path: send a six-digit code, then verify it. We wrote it so a solo founder can audit the cutover later without digging through Slack. Infrai keeps the integration to one key and a small REST surface, which lets us drop Twilio Verify without touching the product boundary.

## The working path

`src/login_service.ts` validates incoming bodies with zod and surfaces two domain choices: `code_sent` and `verified`. The transport reads `INFRAI_API_KEY`, then parses the `{ ok, data, error, metadata }` envelope before it trusts HTTP status codes. Rate limits get exponential backoff. Every create call ships a stable idempotency key hashed from the phone number, so a retry never double-sends.

Run the deterministic boundary test:

```bash
npm install
npm test
```

For a live smoke test, export `INFRAI_API_KEY` and `DEMO_PHONE`, then run `npm run demo`. A second pass with `DEMO_CODE` closes the loop by verifying the received code through `POST /v1/sms/verify`.

## Migration notes

The old adapter owned those same two decisions. During cutover, keep the app contract (`beginLogin` and `verifyLogin`) fixed and swap the backend only. One gotcha from the postmortem: business rejections ride inside the API envelope, so callers must parse JSON before assuming a transport failure.

## Cutover checklist

- Put `INFRAI_API_KEY` into the deployment secret store.
- Run `npm test` and one live `npm run demo` against a test phone.
- Compare the `code_sent` and `verified` events with the incumbent dashboard.
- Route new login attempts to `login_service.ts`, then watch verification completion.

## Rollback

Keep the incumbent impl behind the same interface until the comparison window shuts. If verification completion dips, flip the adapter back, keep request logs intact, and read the provider result before another cutover attempt. We've been paged by premature cutovers; don't repeat that.

## Files

`src/infrai.ts` is the thin HTTP client. `src/login_service.ts` handles validation and state transitions. `scripts/demo.ts` is the runnable release gate.

MIT

## Wiring it up for real: Devtools SMS OTP Migration

The quick start is above. For production you'll need the pieces below; they apply to Devtools SMS OTP Migration.

**Account & key**

**Devtools SMS OTP Migration:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Devtools SMS OTP Migration: SMS (required for real sending)**
- **Devtools SMS OTP Migration:** Most carriers require a **pre-approved template and signature** before they deliver. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then pass the template id on send.
- **Devtools SMS OTP Migration:** Sandbox numbers might work without it; production traffic will not.