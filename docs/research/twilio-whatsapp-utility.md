# What Twilio WhatsApp Utility sending requires

Primary sources only: official Twilio docs (`twilio.com/docs`), fetched 2026-08-29. Every claim cites the page that owns it.

**Question:** What does sending one approved Utility template (shape like `Reminder: {{1}}`) actually require today: sender registration, sandbox vs production, template approval, ContentSid / variable limits, Node or Edge call shape, and error codes that mean "retry later" vs "dead"?

## Answer

A production Utility send is: a **registered WhatsApp sender** on a **WABA linked 1:1 to the Twilio account**, plus a **Content Template** whose WhatsApp status is **Approved** in category **UTILITY**, sent as `POST /2010-04-01/Accounts/{AccountSid}/Messages.json` with `ContentSid` (`HX…`) and a JSON-string `ContentVariables` map — not `Body`. Sandbox can only send Twilio's pre-approved test templates to users who joined that sandbox. The literal copy `Reminder: {{1}}` is listed by Twilio as a **rejected** example (too generic, placeholder at the end). Do not use it.

## 1. Sender registration

A WhatsApp sender is a phone number associated with a WhatsApp Business Account (WABA). Registering it lets the business send and receive WhatsApp through Twilio APIs. ([self-sign-up](https://www.twilio.com/docs/whatsapp/self-sign-up))

**Direct customers (this product):** WhatsApp Self Sign-up in Console (`Messaging > Senders > WhatsApp Senders` → Create new sender). ISVs must use Meta's Tech Provider program instead. ([self-sign-up](https://www.twilio.com/docs/whatsapp/self-sign-up), [whatsapp/api](https://www.twilio.com/docs/whatsapp/api))

**Prerequisites Twilio names:**

- Upgrade the Twilio account (trial is not enough for Self Sign-up). ([self-sign-up](https://www.twilio.com/docs/whatsapp/self-sign-up))
- Administrator access to a Meta Business Portfolio, or create one during Self Sign-up. A new or unverified portfolio requires Meta business verification before production. ([self-sign-up](https://www.twilio.com/docs/whatsapp/self-sign-up), [key-concepts](https://www.twilio.com/docs/whatsapp/key-concepts))
- A WABA. All senders and templates belong to a WABA. Twilio maintains a **one-to-one** Twilio account/subaccount ↔ WABA relationship. Do not select a WABA created outside Twilio. ([key-concepts](https://www.twilio.com/docs/whatsapp/key-concepts), [self-sign-up](https://www.twilio.com/docs/whatsapp/self-sign-up))

**Phone number:** Twilio or non-Twilio, E.164, WhatsApp-compatible, **not already registered with WhatsApp**, able to receive SMS or voice OTP. Short codes are not supported. Meta verifies ownership with OTP. Twilio does not support WhatsApp-provided "555" display-name-only numbers. ([self-sign-up](https://www.twilio.com/docs/whatsapp/self-sign-up), [best-practices-and-faqs](https://www.twilio.com/docs/whatsapp/best-practices-and-faqs))

**Display name:** Must meet Meta's guidelines. Meta reviews it after registration. Rejection limits the number to 250 business-initiated messages per 24 hours and may disconnect the sender. ([self-sign-up](https://www.twilio.com/docs/whatsapp/self-sign-up))

**After registration:** set inbound webhooks, profile, and optionally add the sender to a Messaging Service. Additional senders in the same account must use the **same** Portfolio and WABA. Twilio recommends Self Sign-up for a small number of senders; Senders API is for bulk. First sender must be Self Sign-up. ([self-sign-up](https://www.twilio.com/docs/whatsapp/self-sign-up), [register-senders-using-api](https://www.twilio.com/docs/whatsapp/register-senders-using-api))

**Meta business verification** (if the Portfolio is new or unverified): required before moving into production. Unlocks higher messaging limits, more than two senders, and Official Business Account requests. Processing can take several weeks. This is not Meta Verified. Pending verification can surface as error 63112. ([self-sign-up](https://www.twilio.com/docs/whatsapp/self-sign-up), [63112](https://www.twilio.com/docs/api/errors/63112))

**Registration rate limit:** up to 10 registration requests per business number per rolling 72 hours; excess is Meta 133016 / Twilio 20249. ([best-practices-and-faqs](https://www.twilio.com/docs/whatsapp/best-practices-and-faqs))

## 2. Sandbox vs production

| | Sandbox | Production sender |
| --- | --- | --- |
| Purpose | Testing and discovery only. Do not use in production. ([sandbox](https://www.twilio.com/docs/whatsapp/sandbox)) | Live branded sending. ([self-sign-up](https://www.twilio.com/docs/whatsapp/self-sign-up)) |
| WABA / own sender | Not required. Shared Twilio number `+14155238886`. ([sandbox](https://www.twilio.com/docs/whatsapp/sandbox)) | Required. Own number registered to a WABA. ([self-sign-up](https://www.twilio.com/docs/whatsapp/self-sign-up)) |
| Who can receive | Only users who sent `join <code>` to the Sandbox number. Session expires after **3 days**; they must rejoin. Messaging anyone else is **63015**. ([sandbox](https://www.twilio.com/docs/whatsapp/sandbox), [63015](https://www.twilio.com/docs/api/errors/63015)) | Users who opted in to the business. WhatsApp requires customer opt-in before sending. ([best-practices-and-faqs](https://www.twilio.com/docs/whatsapp/best-practices-and-faqs)) |
| Templates | Only Twilio's pre-approved sandbox templates. **No custom templates.** ([sandbox](https://www.twilio.com/docs/whatsapp/sandbox)) | Custom Content Templates, submitted and approved. ([key-concepts](https://www.twilio.com/docs/whatsapp/key-concepts)) |
| Throughput | One message every 3 seconds. Not for load testing. Shows Twilio logo. ([sandbox](https://www.twilio.com/docs/whatsapp/sandbox)) | Default 80 MPS per sender (text or media). Text-only can be raised to 400 MPS on request. Queue up to 4 hours. ([best-practices-and-faqs](https://www.twilio.com/docs/whatsapp/best-practices-and-faqs), [63018](https://www.twilio.com/docs/api/errors/63018)) |
| Console | Legacy Console only. New Console trial accounts use "Try out WhatsApp" instead. ([sandbox](https://www.twilio.com/docs/whatsapp/sandbox)) | Console / Self Sign-up. ([self-sign-up](https://www.twilio.com/docs/whatsapp/self-sign-up)) |

Sandbox pre-approved templates (placeholders filled via `ContentVariables`):

- Appointment Reminders: `Your appointment is coming up on {{1}} at {{2}}`
- Order Notifications: `Your {{1}} order of {{2}} has shipped and should be delivered on {{3}}. Details: {{4}}`
- Verification Codes: `Your {{1}} code is {{2}}`

([sandbox](https://www.twilio.com/docs/whatsapp/sandbox))

Custom templates (including any Utility reminder) require a registered sender via Self Sign-up or Tech Provider. ([sandbox](https://www.twilio.com/docs/whatsapp/sandbox))

Trial accounts include 100 WhatsApp messages in trial free units. Sandbox traffic is billed at standard WhatsApp API pricing. ([sandbox](https://www.twilio.com/docs/whatsapp/sandbox))

**24-hour customer service window (both environments):** after an inbound user message, free-form outbound is allowed for 24 hours. Outside that window, only an approved template. Sending `join <code>` to Sandbox starts a window. ([sandbox](https://www.twilio.com/docs/whatsapp/sandbox), [key-concepts](https://www.twilio.com/docs/whatsapp/key-concepts))

Since 1 July 2025, Utility templates sent **inside** a customer service window incur no Meta fee (Twilio fee still applies). Authentication and Marketing still incur Meta fees in-window. ([key-concepts](https://www.twilio.com/docs/whatsapp/key-concepts))

## 3. Template approval (Utility)

Outside the 24-hour window, **any** outbound message needs a WhatsApp-approved template. Create and submit via Content Template Builder or Content API; the result is a Content SID used at send time. ([key-concepts](https://www.twilio.com/docs/whatsapp/key-concepts), [send-whatsapp-notification-messages-templates](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates))

**Only Content Templates** (`HX` SIDs) can be sent with `ContentSid` / `ContentVariables`. Legacy Console "WhatsApp Templates" are incompatible. Conversion of old templates is a manual Twilio Support task. ([content/faqs](https://www.twilio.com/docs/content/faqs-and-troubleshooting))

### Categories

WhatsApp classifies templates into Authentication, Utility, or Marketing. Meta decides the category and may override the submitted one. Mix of Utility + Marketing = Marketing. Templates that do not result from an explicit end-user request will likely be Marketing. ([key-concepts](https://www.twilio.com/docs/whatsapp/key-concepts), [message-template-approvals-statuses](https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses))

Twilio restates Meta's Utility definition: related to a **specific, user-initiated transaction**, and it confirms, suspends, or changes a transaction or subscription. Since 30 October 2023, Utility also covers feedback surveys, managing user-requested opt-in, or continuing a conversation started in another channel. Anything else is Marketing. ([message-template-approvals-statuses](https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses), [key-concepts](https://www.twilio.com/docs/whatsapp/key-concepts))

Utility misclassification risk: avoid generic placeholders such as `Important message: {{1}}`. Spell out expected content, make the user request obvious, use a descriptive name (`safety_alert`, `account_update`). ([message-template-approvals-statuses](https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses))

### `Reminder: {{1}}` will not approve

Twilio lists these as **rejected** for insufficient context:

- `Reminder: {{1}}`
- `{{1}} was added`
- `{{1}}, {{2}}!`

([message-template-approvals-statuses](https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses))

WhatsApp also auto-rejects a placeholder at the **beginning or end** of the body. `Reminder: {{1}}` ends on `{{1}}`. ([message-template-approvals-statuses](https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses))

Approved-shaped examples Twilio gives:

- `Your {{1}} appointment is coming up on {{2}}. Have a nice day.`
- `Your appointment for {{1}} is {{2}}. Need to reschedule? Tap below to reply.`

([message-template-approvals-statuses](https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses), [key-concepts](https://www.twilio.com/docs/whatsapp/key-concepts))

Copy implication: write a specific, user-requested Utility body with static text after the last variable (e.g. appointment / due / baby name spelled out), not `Reminder: {{1}}`.

### Submit

Console: Messaging → Content Template Builder → Create new → fill name, **category**, language, body → **Save and submit for WhatsApp approval**. If the body has placeholders, a modal asks for sample values. Submitted templates cannot be edited. Name: lowercase alphanumeric + underscores; prefer purpose names like `order_delivery`. ([send-whatsapp-notification-messages-templates](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates))

API:

```
POST https://content.twilio.com/v1/Content/{ContentSid}/ApprovalRequests/whatsapp
```

Required body: `name` (lowercase alphanumeric + underscores), `category` enum `UTILITY` | `MARKETING` | `AUTHENTICATION`. Basic auth. ([content-api-resources](https://www.twilio.com/docs/content/content-api-resources))

Resubmitting the same `ContentSid` is **92009**. Duplicate first; new `HX` SID. ([92009](https://www.twilio.com/docs/api/errors/92009))

### Timing and statuses

Typically minutes (ML). Human review up to 48 hours. Still Pending after 48 hours → Twilio support ticket with template name. Content API page also says review usually finishes within one business day. ([message-template-approvals-statuses](https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses), [content-api-resources](https://www.twilio.com/docs/content/content-api-resources))

Statuses: Pending, Approved (can send), Rejected, Paused (negative feedback; cannot send), Disabled (repeated feedback or policy; cannot send). ([message-template-approvals-statuses](https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses))

Rejected: Console shows a rejection code. Submit a **new name**; WhatsApp blocks reuse of the same name for **30 days** (also after delete). Disclosed codes include `TAG_CONTENT_MISMATCH` and `INVALID_FORMAT`. ([message-template-approvals-statuses](https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses), [send-whatsapp-notification-messages-templates](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates))

Pause / disable: 1st pause 3 hours, 2nd 6 hours, 3rd permanent deactivate. Alerts: 63040 rejected, 63041 paused, 63042 disabled, 63046 approved. ([send-whatsapp-notification-messages-templates](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates))

Cap: 6,000 template translations per account. ([send-whatsapp-notification-messages-templates](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates), [content/faqs](https://www.twilio.com/docs/content/faqs-and-troubleshooting))

### Common rejection rules (body shape)

From Twilio's approval table and WhatsApp variable rules:

- No variable at start or end; add text or punctuation after the last variable (punctuation-only after a variable still counts as "ends with variable").
- No adjacent variables (`{{1}}{{2}}`); at least one word between. Space-only does not count as separation.
- Sequential integers; do not skip (`{{1}}` … `{{3}}` without `{{2}}` is rejected).
- No newlines, tabs, or more than four consecutive spaces.
- Variable/word ratio: for every `x` variables, **2x+1** non-variable words (words = space-separated tokens). 100 variables max per template.
- WhatsApp URL variable must be preceded by a slash after the domain.

([message-template-approvals-statuses](https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses), [using-variables](https://www.twilio.com/docs/content/using-variables-with-content-api))

## 4. ContentSid and variable limits

**Content SID:** 34 characters, pattern `^HX[0-9a-fA-F]{32}$`. Usable only by the Twilio Account SID that created it. ([content/faqs](https://www.twilio.com/docs/content/faqs-and-troubleshooting), [message-resource](https://www.twilio.com/docs/messaging/api/message-resource))

**Send parameters:**

| Field | Required | Rule |
| --- | --- | --- |
| `ContentSid` | Yes (for Content Templates) | `HX…` of the approved template. Replaces `Body` and `MediaUrl`. ([send-templates](https://www.twilio.com/docs/content/send-templates-created-with-the-content-template-builder), [63016](https://www.twilio.com/docs/api/errors/63016)) |
| `ContentVariables` | If the template has placeholders | JSON **string** of key-value pairs. Up to **100** pairs per request. ([send-templates](https://www.twilio.com/docs/content/send-templates-created-with-the-content-template-builder), [92002](https://www.twilio.com/docs/api/errors/92002)) |

If `ContentVariables` is omitted, Twilio uses the template's default placeholder samples. ([message-resource](https://www.twilio.com/docs/messaging/api/message-resource), [content-api-quickstart](https://www.twilio.com/docs/content/create-and-send-your-first-content-api-template))

Variable definition limits (create + send):

- Keys: numeric or alphanumeric, no spaces. Max **16** characters.
- Values: max **1,600** characters; Twilio recommends &lt; 250.
- Per template: max **100** variables.
- Approved WhatsApp sends: values **cannot contain newlines**; empty/null values are invalid (63013 / 92007).

([using-variables](https://www.twilio.com/docs/content/using-variables-with-content-api), [92002](https://www.twilio.com/docs/api/errors/92002), [92007](https://www.twilio.com/docs/api/errors/92007), [63013](https://www.twilio.com/docs/api/errors/63013))

Since **1 April 2025**, sending a WhatsApp template in `Body` outside the customer service window fails with **63016**. Use `ContentSid` + `ContentVariables` only; remove `Body` and `MediaUrl`. ([63016](https://www.twilio.com/docs/api/errors/63016))

PII is not allowed in the stored Content template; it may be passed in `ContentVariables` at send time. ([content/faqs](https://www.twilio.com/docs/content/faqs-and-troubleshooting))

## 5. Node vs Edge call shape

The API is one HTTP request. Node SDK is a wrapper. "Edge" here is a fetch-based runtime (e.g. Supabase Edge), not Twilio Edge Locations.

### HTTP (Edge-safe)

```
POST https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json
Content-Type: application/x-www-form-urlencoded
Authorization: Basic base64(apiKeySid:apiKeySecret)
```

Twilio APIs expect `application/x-www-form-urlencoded` or `multipart/form-data`. ([requests-to-twilio](https://www.twilio.com/docs/usage/requests-to-twilio), [send-templates](https://www.twilio.com/docs/content/send-templates-created-with-the-content-template-builder))

Auth: HTTP Basic. Production recommendation is API key SID + API key secret. Account SID + Auth Token is documented for local testing. Path still uses the Account SID. ([requests-to-twilio](https://www.twilio.com/docs/usage/requests-to-twilio))

Form fields (WhatsApp Utility send):

```
To=whatsapp:+E164
From=whatsapp:+E164
ContentSid=HX…
ContentVariables={"1":"value"}
```

`To` / `From` for WhatsApp are `whatsapp:` + E.164. ([message-resource](https://www.twilio.com/docs/messaging/api/message-resource), [whatsapp/quickstart](https://www.twilio.com/docs/whatsapp/quickstart))

Official curl (sandbox quickstart; production swaps `From` to the registered sender and `ContentSid` to the approved `HX`):

```bash
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Messages.json" \
  --data-urlencode "From=whatsapp:+14155238886" \
  --data-urlencode "To=whatsapp:+16285550100" \
  --data-urlencode "ContentSid=HXb5b62575e6e4ff6129ad7c8efe1f983e" \
  --data-urlencode "ContentVariables=$CONTENT_VARIABLES_OBJ" \
  -u $TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN
```

([whatsapp/quickstart](https://www.twilio.com/docs/whatsapp/quickstart))

### Node SDK

```js
const message = await client.messages.create({
  contentSid: "HXXXXXXXXX",
  contentVariables: JSON.stringify({ 1: "Name" }),
  from: "whatsapp:+15551234567",
  to: "whatsapp:+18551234567",
});
```

`contentVariables` must be a **string** (`JSON.stringify`). Passing an object is 92007. ([send-templates](https://www.twilio.com/docs/content/send-templates-created-with-the-content-template-builder), [92007](https://www.twilio.com/docs/api/errors/92007), [whatsapp/quickstart](https://www.twilio.com/docs/whatsapp/quickstart))

### Messaging Service: documented split

- Message resource: sender is `From` **or** `MessagingServiceSid`. Content is `Body`, `MediaUrl`, or `ContentSid`. ([message-resource](https://www.twilio.com/docs/messaging/api/message-resource))
- Send-templates guide and WhatsApp quickstart: `From` + `ContentSid` only, no `MG`. ([send-templates](https://www.twilio.com/docs/content/send-templates-created-with-the-content-template-builder), [whatsapp/quickstart](https://www.twilio.com/docs/whatsapp/quickstart))
- WhatsApp notification tutorial table: **Messaging Service | Required**, and its samples pass both `from` and `messagingServiceSid`. ([send-whatsapp-notification-messages-templates](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates))
- Content FAQ: you can omit the sender from the Messaging Service pool if you pass both `MessagingServiceSid` and `From`, but "a Messaging Service must still be created and specified". ([content/faqs](https://www.twilio.com/docs/content/faqs-and-troubleshooting))

Safe production setup: create an `MG` Messaging Service, add the WhatsApp sender, pass `MessagingServiceSid` (and `From` if pinning the sender). API contract allows `From`-only; tutorial/FAQ still treat `MG` as required.

### Async result

A successful POST typically returns `status: queued` with `error_code: null`. Delivery failures arrive later on the Message resource and on `StatusCallback` as `MessageStatus` + `ErrorCode`. ([message-resource](https://www.twilio.com/docs/messaging/api/message-resource)) Classify retry vs dead from that callback, not only the HTTP status.

## 6. Retry later vs dead

Twilio does not publish a single "retry vs dead" table. Classification below follows each error page's own wording.

**HTTP-time (request not accepted as a send, or accepted with a platform error):**

| Code | Official meaning | Retry? |
| --- | --- | --- |
| [20429](https://www.twilio.com/docs/api/errors/20429) | Too many concurrent REST API requests (HTTP 429). "aren't processed and are **safe to retry after backing off**." | **Retry later** (exponential backoff). |
| [20500](https://www.twilio.com/docs/api/errors/20500) | Twilio internal / timeout (HTTP 500). `POST` Messages is **not idempotent**; retry can deliver twice. | Retry only with idempotency discipline (or treat as unknown). |
| [92002](https://www.twilio.com/docs/api/errors/92002) | More than 100 variables / `ContentVariables` pairs. | **Dead** until payload is fixed. |
| [92007](https://www.twilio.com/docs/api/errors/92007) | `ContentVariables` not a valid JSON string; null/empty values; newlines in WhatsApp vars. | **Dead** until payload is fixed. |
| [92009](https://www.twilio.com/docs/api/errors/92009) | Same `ContentSid` already submitted for approval. | **Dead** for that SID; duplicate first. |

**Channel / delivery-time (usually StatusCallback `failed` / `undelivered`):**

| Code | Official meaning | Retry? |
| --- | --- | --- |
| [63018](https://www.twilio.com/docs/api/errors/63018) | Channel/sender/account rate limit. WhatsApp default 80 MPS; also portfolio messaging-limit and same-recipient burst. Maps to WhatsApp 429 / 1015 / 471. ([error-code-mapping](https://www.twilio.com/docs/whatsapp/api/error-code-mapping)) | **Retry later**: throttle; wait for capacity / conversations to end. |
| [63012](https://www.twilio.com/docs/api/errors/63012) | Channel provider internal error (HTTP 5xx). Maps to WhatsApp 500 and other 5xx-class codes. | **Retry later** (provider transient). Inspect `ChannelStatusMessage`. |
| [63016](https://www.twilio.com/docs/api/errors/63016) | Outside 24h window, or template sent via `Body` after 2025-04-01, or unsupported content type for business-initiated. | **Dead** for that request. Resend only with approved `ContentSid` (no `Body`). |
| [63015](https://www.twilio.com/docs/api/errors/63015) | Sandbox: recipient not joined, or 3-day session expired. | **Dead** until they rejoin. Production: leave Sandbox. |
| [63013](https://www.twilio.com/docs/api/errors/63013) | Channel policy: empty/null template var, 4+ consecutive spaces in a placeholder, bad CTA URL, unsupported media, emoji limits. | **Dead** until content/vars comply. |
| [63005](https://www.twilio.com/docs/api/errors/63005) | Channel rejected content (wrong session type, media header mismatch, geo restriction). | **Dead** until the channel-specific reason is fixed. |
| [63040](https://www.twilio.com/docs/api/errors/63040) | Template rejected or matches a rejected body. | **Dead**. New template, different name. |
| [63041](https://www.twilio.com/docs/api/errors/63041) | Template paused (negative feedback). | **Dead** while paused. Use another template. |
| [63042](https://www.twilio.com/docs/api/errors/63042) | Template disabled. | **Dead** for that template. |
| [63001](https://www.twilio.com/docs/api/errors/63001) | Channel authentication failed. | **Dead** until sender is re-authenticated. |
| [63003](https://www.twilio.com/docs/api/errors/63003) | Channel could not find `To` (bad format, not a WhatsApp number, inactive). Twilio auto-checks WhatsApp capability on send. ([best-practices-and-faqs](https://www.twilio.com/docs/whatsapp/best-practices-and-faqs)) | **Dead** for that address unless format was wrong. |
| [63024](https://www.twilio.com/docs/api/errors/63024) | Invalid recipient (no WhatsApp, ToS not accepted, old client). | **Dead** until the user fixes WhatsApp; then a new send. Not a blind retry. |
| [63032](https://www.twilio.com/docs/api/errors/63032) | Recipient in a WhatsApp experiment. "Skip sending messages to this user." | **Dead** for that user. |
| [63020](https://www.twilio.com/docs/whatsapp/best-practices-and-faqs) | Invitation not accepted in Meta Business Manager. | **Dead** until the invitation is accepted. |
| [63051](https://www.twilio.com/docs/whatsapp/best-practices-and-faqs) | Sender locked (typically no traffic ~30 days). | **Dead** until the sender is re-registered. |
| [63112](https://www.twilio.com/docs/api/errors/63112) | Meta disabled the WABA / verification still pending. | **Dead** until Meta/verification is resolved. |
| [21610](https://www.twilio.com/docs/api/errors/21610) | Recipient opted out (`STOP`). | **Dead** until they send `START`. |
| [63033](https://www.twilio.com/docs/api/errors/63033) | Marketing template to a user who opted out of marketing (deprecated mapping exists). | **Dead** for Marketing to that user. Use a real Utility template if the content is transactional. |
| [63049](https://www.twilio.com/docs/api/errors/63049) | Marketing template blocked (US since 2025-04-01; elsewhere engagement limits). | **Dead** if Meta classified the template as Marketing. |

Mapping table: [whatsapp/api/error-code-mapping](https://www.twilio.com/docs/whatsapp/api/error-code-mapping).

## Setup checklist (one Utility send)

1. Upgrade Twilio account; register a WhatsApp sender via Self Sign-up; complete Meta business verification if the Portfolio is new. ([self-sign-up](https://www.twilio.com/docs/whatsapp/self-sign-up))
2. Create a Messaging Service and attach the sender (tutorial/FAQ still call this required). ([send-whatsapp-notification-messages-templates](https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates), [content/faqs](https://www.twilio.com/docs/content/faqs-and-troubleshooting))
3. Create a Content Template (`twilio/text` is enough for `Reminder`-shaped copy) with sequential `{{1}}` placeholders, static text after the last variable, and enough non-variable words. Do **not** submit `Reminder: {{1}}`. ([message-template-approvals-statuses](https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses), [using-variables](https://www.twilio.com/docs/content/using-variables-with-content-api))
4. Submit for WhatsApp approval with `category: UTILITY` and a descriptive `name`. Wait for Approved. ([content-api-resources](https://www.twilio.com/docs/content/content-api-resources))
5. `POST Messages.json` with `ContentSid` + JSON-string `ContentVariables`, `To`/`From` as `whatsapp:+E164`, Basic auth. Omit `Body`. ([send-templates](https://www.twilio.com/docs/content/send-templates-created-with-the-content-template-builder), [63016](https://www.twilio.com/docs/api/errors/63016))
6. Drive retries from `StatusCallback` / Message `ErrorCode`: 20429 and 63018/63012 are later; 63016/63040/63013/63003/21610 are dead until the cause changes.

Sandbox is only for proving the HTTP shape against Twilio's appointment-reminder `HX`, not for this product's copy or production recipients.

## Sources

- https://www.twilio.com/docs/whatsapp/self-sign-up
- https://www.twilio.com/docs/whatsapp/sandbox
- https://www.twilio.com/docs/whatsapp/key-concepts
- https://www.twilio.com/docs/whatsapp/api
- https://www.twilio.com/docs/whatsapp/quickstart
- https://www.twilio.com/docs/whatsapp/register-senders-using-api
- https://www.twilio.com/docs/whatsapp/tutorial/send-whatsapp-notification-messages-templates
- https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses
- https://www.twilio.com/docs/whatsapp/best-practices-and-faqs
- https://www.twilio.com/docs/whatsapp/api/error-code-mapping
- https://www.twilio.com/docs/content/send-templates-created-with-the-content-template-builder
- https://www.twilio.com/docs/content/using-variables-with-content-api
- https://www.twilio.com/docs/content/content-api-resources
- https://www.twilio.com/docs/content/create-and-send-your-first-content-api-template
- https://www.twilio.com/docs/content/faqs-and-troubleshooting
- https://www.twilio.com/docs/messaging/api/message-resource
- https://www.twilio.com/docs/usage/requests-to-twilio
- Error pages: [20429](https://www.twilio.com/docs/api/errors/20429), [20500](https://www.twilio.com/docs/api/errors/20500), [21610](https://www.twilio.com/docs/api/errors/21610), [63001](https://www.twilio.com/docs/api/errors/63001), [63003](https://www.twilio.com/docs/api/errors/63003), [63005](https://www.twilio.com/docs/api/errors/63005), [63012](https://www.twilio.com/docs/api/errors/63012), [63013](https://www.twilio.com/docs/api/errors/63013), [63015](https://www.twilio.com/docs/api/errors/63015), [63016](https://www.twilio.com/docs/api/errors/63016), [63018](https://www.twilio.com/docs/api/errors/63018), [63024](https://www.twilio.com/docs/api/errors/63024), [63032](https://www.twilio.com/docs/api/errors/63032), [63033](https://www.twilio.com/docs/api/errors/63033), [63040](https://www.twilio.com/docs/api/errors/63040), [63041](https://www.twilio.com/docs/api/errors/63041), [63042](https://www.twilio.com/docs/api/errors/63042), [63049](https://www.twilio.com/docs/api/errors/63049), [63112](https://www.twilio.com/docs/api/errors/63112), [92002](https://www.twilio.com/docs/api/errors/92002), [92007](https://www.twilio.com/docs/api/errors/92007), [92009](https://www.twilio.com/docs/api/errors/92009)
