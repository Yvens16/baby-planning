# Sending Delivery as a push from a Supabase Edge Function

**Research date:** 2026-08-31  
**Context:** Baby-planning app — a Vercel Next.js web app. Delivery is a **push** from the due-check Edge Function (not Twilio WhatsApp). Supabase does not ship a one-click push product; the first-party path is an Edge Function that calls a provider. This note answers what sending **one Delivery** requires today: provider fit, token storage, permission / subscription lifecycle, Deno/Edge call shape, payload limits, retry-later vs dead errors, and local CLI/Docker vs hosted.

Domain words: **Delivery** is the send; **push** is the channel. Recipients are Operators. Do not treat “notification” or “user” as domain terms.

---

## Executive recommendation

**Send Delivery with Firebase Cloud Messaging HTTP v1 from the due-check Edge Function. On the Next.js client, use the FCM JavaScript SDK (FCM-for-web), not Expo and not a Next.js Server Action.**

Rationale:

1. **This app is a web app.** Expo Push is a React Native / iOS / Android path (`expo-notifications` platforms are Android and iOS). It is not a send path for a Vercel Next.js site. ([Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/), [Supabase Expo example](https://supabase.com/docs/guides/functions/examples/push-notifications))
2. **Supabase’s documented web send path is FCM.** The same guide documents Expo (native) and FCM (iOS, Android, **and Web**). The FCM sample is a Deno Edge Function: mint a Google OAuth token from a Firebase service account, then `POST https://fcm.googleapis.com/v1/projects/{project_id}/messages:send`. ([Supabase push notifications](https://supabase.com/docs/guides/functions/examples/push-notifications), [FCM `messages.send`](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages/send))
3. **FCM-for-web is Web Push underneath.** The FCM JS SDK subscribes via the browser Push API and VAPID keys, then gives the app a registration token (legacy) or Firebase Installation ID (current). The Edge Function never talks to `*.push.apple.com` or Chrome’s push service itself. ([FCM web client](https://firebase.google.com/docs/cloud-messaging/js/client), [FCM for Safari](https://firebase.blog/posts/2023/08/fcm-for-safari/))
4. **Safari / iPhone is in play, with Apple’s Home Screen rule.** FCM JS can target Safari 16+ on macOS and Home Screen web apps on iOS / iPadOS 16.4+. A Safari **tab** on iPhone cannot subscribe; the Operator must add the app to the Home Screen and grant permission from a user gesture. That is Apple’s Web Push rule, not an FCM extra. ([Apple web push](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers), [FCM for Safari](https://firebase.blog/posts/2023/08/fcm-for-safari/), [Next.js PWA](https://nextjs.org/docs/app/guides/progressive-web-apps))
5. **Do not send from Next.js.** The official Next.js PWA guide uses Node `web-push` in Server Actions. Delivery send already belongs in the due-check Edge Function ([ADR-0001](../adr/0001-due-check-hybrid-cron.md) — hybrid cron + TypeScript send). Keep error taxonomy and retries there. The provider in that function is now FCM, not Twilio.

**Direct Web Push (VAPID, no Firebase)** is a viable alternative: same browser APIs, Next.js documents the client, Apple documents the Safari send. The Edge Function then must encrypt the payload (RFC 8291) and sign a VAPID JWT (RFC 8292) itself. FCM is the smaller Deno send.

**Credentials this unblocks:** a Firebase project; Cloud Messaging API (HTTP v1) enabled; a service-account JSON (`client_email`, `private_key`, `project_id`) as an Edge Function secret; a Web Push VAPID key pair in the Firebase console, public key in the Next.js app.

---

## Comparison of providers

| Criterion | 1. FCM HTTP v1 for Web | 2. Direct Web Push (VAPID) | 3. Expo Push Service |
| --- | --- | --- | --- |
| **Fits a Vercel Next.js web app** | **Yes** — FCM JS SDK + HTTPS origin ([FCM web client](https://firebase.google.com/docs/cloud-messaging/js/client)) | **Yes** — Push API + service worker ([Next.js PWA](https://nextjs.org/docs/app/guides/progressive-web-apps), [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)) | **No** — Expo documents Android and iOS apps, EAS credentials, `ExpoPushToken` ([Expo setup](https://docs.expo.dev/push-notifications/push-notifications-setup/)) |
| **Supabase Edge Function example** | **Yes** — `google-auth-library` JWT + `fetch` to FCM v1 ([Supabase FCM sample](https://supabase.com/docs/guides/functions/examples/push-notifications)) | Not in the Supabase guide | **Yes**, but the sample is Expo / React Native ([Supabase Expo sample](https://supabase.com/docs/guides/functions/examples/push-notifications)) |
| **Call from Deno/Edge** | `POST /v1/projects/{id}/messages:send` with `Authorization: Bearer <OAuth>` ([auth](https://firebase.google.com/docs/cloud-messaging/auth-server)) | `POST` to `PushSubscription.endpoint` with `TTL`, VAPID `Authorization`, `Content-Encoding: aes128gcm` ([RFC 8030](https://datatracker.ietf.org/doc/html/rfc8030), [RFC 8292](https://datatracker.ietf.org/doc/html/rfc8292), [Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)) | `POST https://exp.host/--/api/v2/push/send` ([Expo sending](https://docs.expo.dev/push-notifications/sending-notifications)) |
| **What to store per device** | `fcm_token` text (Supabase sample) **or** Firebase Installation ID + timestamp (current FCM guidance). One row per Operator × browser instance. ([Supabase FCM sample](https://supabase.com/docs/guides/functions/examples/push-notifications), [manage tokens](https://firebase.google.com/docs/cloud-messaging/manage-tokens)) | `PushSubscription` JSON: `endpoint`, `expirationTime`, `keys.p256dh`, `keys.auth`. Capability URL — keep secret. ([MDN `toJSON`](https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription/toJSON), [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)) | `ExponentPushToken[…]` — native only |
| **iOS Safari** | Home Screen web app, iOS 16.4+, user gesture, `manifest.display` `standalone` or `fullscreen` ([FCM for Safari](https://firebase.blog/posts/2023/08/fcm-for-safari/)) | Same Apple rules ([Apple web push](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)) | N/A (native APNs via Expo) |
| **Payload limit** | 4096 bytes (2048 to topics) ([FCM errors](https://firebase.google.com/docs/cloud-messaging/error-codes), [message types](https://firebase.google.com/docs/cloud-messaging/customize-messages/set-message-type)) | Push services must accept ≤ 4096 bytes; Apple cap 4 KB ([RFC 8030 §7.2](https://datatracker.ietf.org/doc/html/rfc8030#section-7.2), [Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers)) | 4096 bytes to APNs/FCM ([Expo sending](https://docs.expo.dev/push-notifications/sending-notifications)) |
| **Dead token** | `UNREGISTERED` (404); `INVALID_ARGUMENT` (400) when the payload is known-good ([manage tokens](https://firebase.google.com/docs/cloud-messaging/manage-tokens)) | HTTP **410 Gone** (expired device token / subscription) or **404** expired subscription ([Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers), [RFC 8030 §7.3](https://datatracker.ietf.org/doc/html/rfc8030#section-7.3)) | `DeviceNotRegistered` on ticket or receipt ([Expo errors](https://docs.expo.dev/push-notifications/sending-notifications)) |
| **Retry later** | `UNAVAILABLE` 503 (honor `Retry-After`, exponential backoff); `INTERNAL` 500; `QUOTA_EXCEEDED` 429 ([FCM errors](https://firebase.google.com/docs/cloud-messaging/error-codes)) | 429, 500, 503 ([Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers), [RFC 8030](https://datatracker.ietf.org/doc/html/rfc8030)) | `MessageRateExceeded`, `TOO_MANY_REQUESTS` ([Expo errors](https://docs.expo.dev/push-notifications/sending-notifications)) |
| **Extra product** | Firebase project + service account + VAPID in Firebase console | VAPID key pair only; Edge Function implements encryption | Expo project + EAS + FCM/APNs native credentials |
| **Viability today** | **Recommended** | Viable if avoiding Firebase; more send-side work on Deno | **Not for this app** |

---

## Minimum flow (recommended: FCM-for-web)

### Prerequisites (one-time)

1. Firebase project with **Cloud Messaging API (HTTP v1)** enabled. ([server environment](https://firebase.google.com/docs/cloud-messaging/http-server-ref))
2. Web app registered; **Web Push certificates** VAPID key pair generated (or imported) in Firebase Console → Project settings → Cloud Messaging. ([FCM web client](https://firebase.google.com/docs/cloud-messaging/js/client))
3. Service account private key (`Project settings → Service accounts → Generate new private key`). Scope for send: `https://www.googleapis.com/auth/firebase.messaging`. ([authorize send](https://firebase.google.com/docs/cloud-messaging/auth-server))
4. Store the service-account fields as **Edge Function secrets** (`supabase secrets set` hosted; `supabase/functions/.env` locally). Do not commit the JSON. The Supabase sample imports `service-account.json` from the functions directory — that is a local convenience, not a production secret store. ([Supabase secrets](https://supabase.com/docs/guides/functions/secrets), [Supabase FCM sample](https://supabase.com/docs/guides/functions/examples/push-notifications))
5. Next.js web app on HTTPS (Vercel). Service workers require a secure context. Locally: `next dev --experimental-https`. ([FCM web client](https://firebase.google.com/docs/cloud-messaging/js/client), [Next.js PWA testing](https://nextjs.org/docs/app/guides/progressive-web-apps))
6. Web app manifest with `display: "standalone"` (or `fullscreen`) so iOS can be a Home Screen web app. ([Next.js PWA](https://nextjs.org/docs/app/guides/progressive-web-apps), [FCM for Safari](https://firebase.blog/posts/2023/08/fcm-for-safari/))
7. `firebase-messaging-sw.js` at the site root (or a worker passed into the SDK). ([FCM web client](https://firebase.google.com/docs/cloud-messaging/js/client), [receive messages](https://firebase.google.com/docs/cloud-messaging/js/receive))

Due-check scheduling is unchanged: hosted `pg_cron` every five minutes POSTs the Edge Function ([ADR-0001](../adr/0001-due-check-hybrid-cron.md)).

### Per-Operator reachability (client)

| Step | Actor | Action |
| --- | --- | --- |
| 1 | Operator | On iOS: add the app to the Home Screen and open it from the icon. Desktop Safari / Chrome / Firefox: origin is enough. ([Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers), [FCM for Safari](https://firebase.blog/posts/2023/08/fcm-for-safari/)) |
| 2 | Operator | User gesture (button). `Notification.requestPermission()`. Values: `granted` / `denied` / `default` (treat `default` as denied). ([MDN Notification](https://developer.mozilla.org/en-US/docs/Web/API/Notification), [MDN `requestPermission`](https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission), [FCM web client](https://firebase.google.com/docs/cloud-messaging/js/client)) |
| 3 | App | If `granted`: `register(messaging, { vapidKey })` then persist the Firebase Installation ID from `onRegistered` (current) **or** `getToken({ vapidKey })` (deprecated but what the Supabase sample’s `fcm_token` column matches). ([FCM web client](https://firebase.google.com/docs/cloud-messaging/js/client), [manage tokens](https://firebase.google.com/docs/cloud-messaging/manage-tokens)) |
| 4 | App | Upsert a **device row** for this Operator: token or FID, `updated_at`. One Operator, many browsers. Re-upload on every `onRegistered` / `pushsubscriptionchange`. ([manage tokens](https://firebase.google.com/docs/cloud-messaging/manage-tokens), [MDN `pushsubscriptionchange`](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)) |
| 5 | Operator | `denied`: Operator is not reachable on that browser. Do not prompt again from that origin. ([MDN Notification](https://developer.mozilla.org/en-US/docs/Web/API/Notification)) |
| 6 | App | Unsubscribe / permission revoked: delete the device row. |

Chrome and Edge require `userVisibleOnly: true` on `PushManager.subscribe`. FCM’s SDK takes that path; silent (non-user-visible) push is not available on Safari. ([MDN `subscribe`](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe), [Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers))

An Operator is a viable **Recipient** when they have at least one live device row. That replaces WhatsApp E.164 proof.

### Per-Delivery send (due-check Edge Function)

Supabase’s FCM sample (webhook-triggered) is the call shape; due-check uses the same `fetch` after the SQL due query, not a `notifications` table insert.

1. Load each Recipient’s device rows.
2. Mint a short-lived OAuth access token from the service account (JWT, scope `firebase.messaging`). ([authorize send](https://firebase.google.com/docs/cloud-messaging/auth-server), [Supabase sample](https://supabase.com/docs/guides/functions/examples/push-notifications))
3. For each device:

```http
POST https://fcm.googleapis.com/v1/projects/{project_id}/messages:send
Content-Type: application/json
Authorization: Bearer {access_token}
```

```json
{
  "message": {
    "token": "<fcm_token or use fid>",
    "notification": {
      "title": "<Reminder title>",
      "body": "<short Delivery copy>"
    },
    "webpush": {
      "fcm_options": {
        "link": "https://<app-origin>/"
      }
    }
  }
}
```

([`messages.send`](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages/send), [Message / WebpushConfig](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages#Message), [receive on web](https://firebase.google.com/docs/cloud-messaging/js/receive), [authorize send](https://firebase.google.com/docs/cloud-messaging/auth-server))

4. Success body includes a message name (`projects/{id}/messages/{id}`). That means FCM **accepted** the send, not that the browser showed UI. ([authorize send](https://firebase.google.com/docs/cloud-messaging/auth-server))
5. Classify the HTTP error (table below). Dead token: delete that device row and continue other devices. Retry-later: leave `delivered_at` unset (failed Delivery stays due). All Recipients with at least one accepted send: set `delivered_at`.

`validate_only: true` on the send body tests the request without delivering. ([`messages.send`](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages/send))

---

## Payload / template constraints

There is no WhatsApp-style template approval. Copy is whatever fits the byte limit and the browser UI.

| Constraint | Limit | Source |
| --- | --- | --- |
| FCM payload (notification and/or data) | **4096 bytes** including keys and values; **2048** for topic sends | [FCM error codes](https://firebase.google.com/docs/cloud-messaging/error-codes), [message types](https://firebase.google.com/docs/cloud-messaging/customize-messages/set-message-type) |
| Web Push body | Push services **must not** 413 a body ≤ **4096 bytes**; Apple documents **4 KB** | [RFC 8030 §7.2](https://datatracker.ietf.org/doc/html/rfc8030#section-7.2), [Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers) |
| FCM `data` values | Strings only; no reserved keys (`from`, `message_type`, `google.*`, `gcm.*`) | [Message](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages#Message), [message types](https://firebase.google.com/docs/cloud-messaging/customize-messages/set-message-type) |
| FCM TTL | Duration 0–2,419,200 seconds (4 weeks) | [FCM error codes](https://firebase.google.com/docs/cloud-messaging/error-codes) |
| Web Push TTL | Required header; seconds the push service may store the message | [RFC 8030 §5.2](https://datatracker.ietf.org/doc/html/rfc8030#section-5.2), [Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers) |
| Click-through URL | `webpush.fcm_options.link` must be **HTTPS** | [WebpushFcmOptions](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages#Message) |
| Visible Delivery | Use a `notification` payload (title + body) so the browser can show UI in the background. Data-only messages need service-worker `showNotification`. Safari revokes permission if the worker receives a push and does not present UI. | [receive messages](https://firebase.google.com/docs/cloud-messaging/js/receive), [Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers) |

Foreground vs background on web: focused tab → `onMessage`; background → display notification / `onBackgroundMessage`. ([receive messages](https://firebase.google.com/docs/cloud-messaging/js/receive))

Keep Delivery copy to title + short body (Reminder title, Baby display name, Due). Do not put notes, IDs dumps, or images in the 4 KiB envelope.

---

## Error taxonomy: retry later vs dead

### FCM HTTP v1 (recommended send)

HTTP v1 errors are `{ error: { code, message, status, details[] } }`. Read `details` for `type.googleapis.com/google.firebase.fcm.v1.FcmError` vs `google.rpc.BadRequest`. ([FCM error codes](https://firebase.google.com/docs/cloud-messaging/error-codes))

| Status | HTTP | Meaning | Handling |
| --- | --- | --- | --- |
| `UNAVAILABLE` | 503 | FCM overloaded | **Retry later.** Honor `Retry-After`. Exponential backoff + jitter. ([FCM errors](https://firebase.google.com/docs/cloud-messaging/error-codes), [server environment](https://firebase.google.com/docs/cloud-messaging/http-server-ref)) |
| `INTERNAL` | 500 | Unknown internal error | **Retry later** (same backoff). Persistent → Firebase status / support. |
| `QUOTA_EXCEEDED` | 429 | Rate / device / topic quota | **Retry later.** Minimum 1 minute backoff for message-rate; slow that device. |
| `UNREGISTERED` | 404 | Token / FID no longer valid | **Dead.** Delete the device row; never send it again. ([manage tokens](https://firebase.google.com/docs/cloud-messaging/manage-tokens)) |
| `INVALID_ARGUMENT` | 400 | Bad payload **or** bad token | If the payload is known-valid: **dead** token — delete. If `google.rpc.BadRequest` field violations (too big, bad key, bad TTL): **fix the payload**, do not delete the token. |
| `SENDER_ID_MISMATCH` | 403 | Token bound to another Firebase sender | **Dead** for this project. Wrong service account / project. |
| `THIRD_PARTY_AUTH_ERROR` | 401 | Web Push auth / VAPID key invalid or missing | **Config.** Fix Web Push certificates; not a per-Operator death. Affects every web send. |
| `UNSPECIFIED_ERROR` | — | No information | Log; treat as retry-later until proven otherwise. |

Trusted-server requirement: the app server **must** handle resend with exponential backoff and store tokens securely. ([server environment](https://firebase.google.com/docs/cloud-messaging/http-server-ref))

Stale registrations: FCM treats ~1 month idle as stale; Android garbage-collects after 270 days. Store `updated_at` on each upload; prune stale rows. ([manage tokens](https://firebase.google.com/docs/cloud-messaging/manage-tokens))

### Direct Web Push (if used instead of FCM)

RFC 8030: **201 Created** = accepted, not displayed. Apple’s table for the Apple push service:

| HTTP | Meaning | Handling |
| --- | --- | --- |
| 201 | Accepted | Success for this device |
| 410 | Device token expired | **Dead** — drop subscription |
| 404 | Invalid path / expired subscription | **Dead** ([RFC 8030 §7.3](https://datatracker.ietf.org/doc/html/rfc8030#section-7.3)) |
| 413 | Payload too large | **Dead send**, not dead device — shrink copy (must accept ≤ 4096) |
| 429 | Too many requests for this destination | **Retry later** |
| 500 / 503 | Internal / unavailable / shutdown | **Retry later** |
| 403 | VAPID / JWT auth | **Config** (`BadJwtToken`, `VapidPkHashMismatch`, …) |
| 400 | Bad request / encryption | **Config / payload** (`BadWebPushRequest`, `BadTtl`, …) |

([Apple web push](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers), [RFC 8030](https://datatracker.ietf.org/doc/html/rfc8030))

### Expo (contrast only)

Ticket / receipt `details.error`: `DeviceNotRegistered` = dead; `MessageTooBig` = shrink payload; `MessageRateExceeded` / request `TOO_MANY_REQUESTS` = retry later. ([Expo sending](https://docs.expo.dev/push-notifications/sending-notifications))

---

## Permission / subscription lifecycle

```
no permission  --user gesture-->  prompt
prompt         --granted-->       subscribe (FCM register / PushManager.subscribe)
               --denied-->        unreachable on this origin (stop prompting)
subscribe      --token/FID-->     upsert device row (Operator + browser instance)
               --pushsubscriptionchange / onRegistered-->  replace row
               --unsubscribe / 410 / UNREGISTERED-->       delete row
```

- **Secure context only.** HTTPS, or localhost with HTTPS for Next.js. ([FCM](https://firebase.google.com/docs/cloud-messaging/js/client), [MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API), [Next.js PWA](https://nextjs.org/docs/app/guides/progressive-web-apps))
- **User gesture.** Firefox 72+ and Safari require the permission request on a click/tap, not on page load. ([MDN `requestPermission`](https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission), [MDN `subscribe`](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe), [FCM for Safari](https://firebase.blog/posts/2023/08/fcm-for-safari/))
- **Origin-bound.** A token or `PushSubscription` from `localhost` is not the Vercel origin. Re-subscribe in production.
- **Visible pushes.** Safari does not support invisible push; failing to `showNotification` can revoke permission. ([Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers))
- **iOS Home Screen.** Push APIs exist only after Add to Home Screen and launch from the icon (iOS 16.4+). No Apple Developer Program membership. Allow `https://*.push.apple.com` if the send path talks to Apple directly (direct Web Push). FCM talks to `fcm.googleapis.com` instead. ([Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers), [FCM for Safari](https://firebase.blog/posts/2023/08/fcm-for-safari/))

---

## Local CLI/Docker vs hosted project

The **provider APIs are the same**. What differs is how the Edge Function runs, where secrets live, and whether cron actually fires.

| Concern | Local (`supabase start` / `functions serve`) | Hosted project |
| --- | --- | --- |
| Edge runtime | CLI **Edge Runtime** (Deno-compatible), not stock `deno run`. Hot reload at `http://localhost:54321/functions/v1/<name>`. ([development environment](https://supabase.com/docs/guides/functions/development-environment)) | Deployed globally: `https://<project-ref>.supabase.co/functions/v1/<name>`. ([deploy](https://supabase.com/docs/guides/functions/deploy)) |
| Function secrets | `supabase/functions/.env` (loaded on `supabase start`) or `supabase functions serve --env-file`. ([secrets](https://supabase.com/docs/guides/functions/secrets)) | `supabase secrets set` / Dashboard. **Not copied from local automatically.** Available immediately; no redeploy required. Hosted-only vars: `SB_REGION`, `SB_EXECUTION_ID`, `DENO_DEPLOYMENT_ID`. |
| Default keys | Local publishable/secret keys; `@supabase/server` also accepts singular `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`. ([auth](https://supabase.com/docs/guides/functions/auth)) | Project keys. `SUPABASE_URL` is the hosted API, not localhost. |
| Service account | Same JSON in local `.env`. FCM send from the laptop works if egress to `fcm.googleapis.com` and `oauth2.googleapis.com` is open. | Same JSON in hosted secrets. |
| Due-check cron | Local stack can load `pg_cron` / `pg_net`; Dashboard Cron UI, hosted Vault, and the function URL differ. Map already: cron + push send need the hosted project. | `pg_cron` → `pg_net` POST to the hosted function ([ADR-0001](../adr/0001-due-check-hybrid-cron.md)). |
| Database webhooks (Supabase sample) | Not required for due-check. Sample uses Dashboard webhooks on `notifications` insert. | Dashboard → Database Webhooks. Due-check should **not** depend on that insert; it already queries due Reminders. |
| Next.js origin | `next dev --experimental-https` or browsers will refuse the service worker / Push API. Tokens issued on localhost are useless in production. ([Next.js PWA](https://nextjs.org/docs/app/guides/progressive-web-apps)) | Vercel HTTPS. Manifest + `firebase-messaging-sw.js` must be at **that** origin. |
| `verify_jwt` | Sample deploys FCM `push` with `--no-verify-jwt` because a webhook/cron calls it. Due-check already uses `verify_jwt = false` + secret `apikey`. ([Supabase sample](https://supabase.com/docs/guides/functions/examples/push-notifications), [ADR-0001](../adr/0001-due-check-hybrid-cron.md)) | Same. |

TDD the send classifier locally (fixture FCM JSON errors). End-to-end Delivery to a real browser needs hosted (or local function + real FCM) plus an HTTPS origin.

---

## Direct Web Push notes (alternative)

If the product skips Firebase:

- Client: Next.js PWA guide — `pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })`, persist `JSON.parse(JSON.stringify(sub))`. ([Next.js PWA](https://nextjs.org/docs/app/guides/progressive-web-apps))
- Send: **still the due-check Edge Function**, not `app/actions.ts`. Node `web-push` is a Next.js Server Action convenience; Deno must POST RFC 8030 itself (encrypt RFC 8291, VAPID JWT RFC 8292 `Authorization: vapid t=…, k=…`). Apple: `TTL`, `Urgency`, `Content-Encoding`; JWT `sub` should be `mailto:` or `https:`; `aud` is the push-service origin; do not refresh the JWT more than once per hour. ([RFC 8292](https://datatracker.ietf.org/doc/html/rfc8292), [Apple](https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers))
- Store the full subscription; the `endpoint` is a capability URL. ([MDN Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API))

---

## Citations index

| Topic | URL |
| --- | --- |
| Supabase Edge Function push examples (Expo + FCM, including Web) | https://supabase.com/docs/guides/functions/examples/push-notifications |
| Supabase Edge Function secrets (local `.env` vs `secrets set`) | https://supabase.com/docs/guides/functions/secrets |
| Supabase functions development environment (`functions serve`) | https://supabase.com/docs/guides/functions/development-environment |
| Supabase functions deploy | https://supabase.com/docs/guides/functions/deploy |
| Supabase Edge Functions auth (`verify_jwt`, secret key) | https://supabase.com/docs/guides/functions/auth |
| FCM HTTP v1 `projects.messages.send` | https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages/send |
| FCM Message / WebpushConfig | https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages#Message |
| FCM authorize send (service account, OAuth scope) | https://firebase.google.com/docs/cloud-messaging/auth-server |
| FCM server environment (backoff, store tokens) | https://firebase.google.com/docs/cloud-messaging/http-server-ref |
| FCM HTTP v1 error codes | https://firebase.google.com/docs/cloud-messaging/error-codes |
| FCM ErrorCode enum | https://firebase.google.com/docs/reference/fcm/rest/v1/ErrorCode |
| FCM registration / FID management | https://firebase.google.com/docs/cloud-messaging/manage-tokens |
| FCM message types and 4096-byte payload | https://firebase.google.com/docs/cloud-messaging/customize-messages/set-message-type |
| FCM JS web client (VAPID, permission, token/FID, HTTPS) | https://firebase.google.com/docs/cloud-messaging/js/client |
| FCM receive messages on web | https://firebase.google.com/docs/cloud-messaging/js/receive |
| FCM JS SDK supported environments | https://firebase.google.com/docs/web/environments-js-sdk |
| Firebase: FCM for Safari / iOS Home Screen | https://firebase.blog/posts/2023/08/fcm-for-safari/ |
| Next.js App Router PWA + Web Push | https://nextjs.org/docs/app/guides/progressive-web-apps |
| MDN Push API | https://developer.mozilla.org/en-US/docs/Web/API/Push_API |
| MDN `PushManager.subscribe` | https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe |
| MDN `PushSubscription` / `toJSON` | https://developer.mozilla.org/en-US/docs/Web/API/PushSubscription |
| MDN Notifications API / `requestPermission` | https://developer.mozilla.org/en-US/docs/Web/API/Notification |
| RFC 8030 HTTP Web Push (TTL, 201, 410, 413, 4096) | https://datatracker.ietf.org/doc/html/rfc8030 |
| RFC 8292 VAPID | https://datatracker.ietf.org/doc/html/rfc8292 |
| Apple: sending web push in web apps and browsers | https://developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers |
| Expo push setup (native) | https://docs.expo.dev/push-notifications/push-notifications-setup/ |
| Expo send API and error codes | https://docs.expo.dev/push-notifications/sending-notifications |
| Expo Notifications SDK (Android, iOS) | https://docs.expo.dev/versions/latest/sdk/notifications/ |
