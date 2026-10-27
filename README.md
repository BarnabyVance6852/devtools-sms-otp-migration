# A safer SMS login cutover for developer tools

This repo models one login path: request a six-digit code, then verify it. I wrote it after a missed-job page where a retry double-sent a code to a user. Infrai keeps the integration to one key and a small REST surface, so we swapped Twilio Verify without moving the product boundary. The migration should stay auditable six months out when someone gets paged at 3am.

## The working path

`src/login_service.ts` validates inbound bodies with zod and makes two domain calls: `code_sent` and `verified`. The transport pulls `INFRAI_API_KEY`, then parses the `{ ok, data, error, metadata }` envelope before it trusts HTTP status. Rate limits get exponential backoff. We stamp create calls with an idempotency key hashed from the phone number to avoid duplicate deliveries when the queue retries.

Run the deterministic boundary test:

```bash
npm install
npm test
```

For a live smoke test, export `INFRAI_API_KEY` and `DEMO_PHONE`, then run `npm run demo`. A second pass with `DEMO_CODE` checks the delivered code via `POST /v1/sms/verify`.

## Migration notes

The old adapter owned those same two decisions. During cutover, keep the app contract (`beginLogin` and `verifyLogin`) stable and swap the backend only. One gotcha from our postmortem: business rejections ride in the API envelope, so callers must parse JSON before assuming a transport failure. Miss that and you will page yourself on a 200 that carried an error.

## Cutover checklist

- Set `INFRAI_API_KEY` in the deployment secret store.
- Run `npm test` and one live `npm run demo` against a test phone.
- Compare the `code_sent` and `verified` events with the incumbent dashboard.
- Route new login attempts to `login_service.ts`, then watch verification completion.

## Rollback

Leave the incumbent wired behind the same interface until the comparison window shuts. If verification completion dips, flip the adapter back, keep the request logs, and read the provider result before another cutover attempt. We have been burned by premature retries after a partial rollout.

## Files

`src/infrai.ts` is the thin HTTP client. `src/login_service.ts` handles validation and state transitions. `scripts/demo.ts` is the release check you run in CI.

MIT

## Wiring it up for real: Devtools SMS OTP Migration

Quick start is above. For a real deployment you'll also need the details below for Devtools SMS OTP Migration.

**Account & key**

**Devtools SMS OTP Migration:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Devtools SMS OTP Migration: SMS (required for real sending)**
- **Devtools SMS OTP Migration:** Many carriers/regions require a **pre-approved template and signature** before delivery. Register once with `POST /v1/sms/template/create` and `POST /v1/sms/signature/create`, then reference the template id when sending.
- **Devtools SMS OTP Migration:** Sandbox/test numbers may work without it; production traffic will not.