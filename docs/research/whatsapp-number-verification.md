# WhatsApp Number Verification for Operators (Twilio Utility Sender)

**Research date:** 2026-08-29  
**Context:** Baby-planning app — Operators enter an E.164 number and must prove they control that WhatsApp inbox before the number becomes active for **Delivery** (French Utility reminder templates on a registered WhatsApp Business sender, not sandbox).

---

## Executive recommendation

**Use Twilio Verify with `Channel=whatsapp` (WhatsApp OTP) as the sole ownership-proof mechanism before activating an Operator as a Recipient.**

Rationale:

1. **Meta policy alignment:** Identity verification via one-time passcodes must use **Authentication** templates. Utility templates (already chosen for reminders) **cannot** send OTPs or perform identity verification. ([Meta template categorization](https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines/))
2. **Proves the exact E.164 entered:** Verify delivers the OTP to the number the Operator typed; a successful `VerificationCheck` confirms inbox access on that number. Click-to-WhatsApp and reply-based Utility pings only prove whichever number actually messages you, which may differ from a mistyped E.164.
3. **Operational fit with Twilio:** Verify auto-creates Meta **Copy Code Authentication** templates in 71 languages (including French `fr`) once you [bring your own WhatsApp Sender](https://www.twilio.com/docs/verify/whatsapp/byo). Reminder Utility templates stay separate and unchanged.
4. **Built-in lifecycle:** 10-minute expiry, 5 check attempts, rate limits, and optional WhatsApp→SMS fallback are handled by Verify APIs rather than custom webhook state machines.

**Also required (not optional):** Collect explicit WhatsApp opt-in in the app UI (business name + consent to receive messages) per Meta policy, independent of the verification channel. ([Meta getting opt-in](https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in/))

**Do not use** a French Utility template as the ownership-proof ping. Reserve Utility templates for due Reminder **Delivery** only.

---

## Comparison of options

| Criterion | 1. Twilio Verify WhatsApp OTP | 2. Click-to-WhatsApp opt-in (user messages first) | 3. One-off Utility template ping + confirmation | 4. Hybrid: Verify OTP + in-app opt-in disclosure |
| --- | --- | --- | --- | --- |
| **Proves ownership of entered E.164** | **Yes** — OTP sent to that exact number; code entry confirms receipt | **Partial** — proves the `From` number on inbound webhook, not necessarily the typed E.164 | **Partial** — reply proves some WhatsApp account, not typed E.164 | **Yes** — same as option 1 for ownership |
| **Meta template category** | **Authentication** (required for OTP) | None for first inbound; free-form replies inside 24h window | **Utility** (wrong category for identity OTP; Meta forbids OTP in Utility) | Authentication + separate opt-in UI |
| **Works with registered Utility sender** | Yes — BYO same WABA; Twilio recommends separate sender for OTP vs marketing ([BYO doc](https://www.twilio.com/docs/verify/whatsapp/byo)) | Yes — inbound on any registered sender | Yes — but misaligned use of Utility category | Yes |
| **French locale** | `Locale=fr` → WhatsApp locale `fr`, button "Copier le code" ([supported languages](https://www.twilio.com/docs/verify/supported-languages)) | Pre-filled `wa.me` message can be French; no template approval needed for inbound | Requires approved French Utility template (separate from reminder templates) | French OTP via Verify; French Utility reserved for reminders |
| **Business-initiated first contact** | Yes (Authentication template via Verify) | No — user initiates | Yes (Utility template) | Yes (Authentication) |
| **Satisfies Meta opt-in alone** | **No** — still need explicit opt-in disclosure in UI ([Meta opt-in](https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in/)) | Strong signal (user-initiated) but still need business-name disclosure in surrounding UX | Requires prior opt-in from another channel per Meta Utility "Opt-In Management" definition ([Meta categorization](https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines/)) | **Yes** when UI includes required opt-in copy |
| **Implementation complexity** | Low — 2 API calls (create + check) | Medium — webhook matching, token in prefilled text, timeout handling | High — custom state machine, template approval, reply parsing | Low–medium |
| **Delivery failure signal** | Verify status + Messaging logs; optional SMS fallback ([changelog](https://www.twilio.com/en-us/changelog/Verify_Fallback_Scenarios)) | No message sent if user never clicks | Template delivery errors (e.g. 63003) | Same as option 1 |
| **Viability today (production sender)** | **Recommended** | Viable as **supplement** for opt-in UX, not sole ownership proof | **Not recommended** — policy mismatch for OTP; weak E.164 binding | **Recommended** (this is the target architecture) |

---

## Minimum flow (recommended: Verify WhatsApp OTP + opt-in)

### Prerequisites (one-time)

1. Registered WhatsApp Business sender on Twilio (not sandbox) via [Self Sign-up](https://www.twilio.com/docs/whatsapp/self-sign-up).
2. Messaging Service (`MG…`) containing the sender.
3. Verify Service (`VA…`) with WhatsApp tab configured to that Messaging Service ([BYO setup](https://www.twilio.com/docs/verify/whatsapp/byo)).
4. Confirm `verify_auto_created` Authentication template is **Approved** in Content Template Builder ([verification templates](https://www.twilio.com/docs/verify/verification-templates)).
5. French Utility reminder templates approved separately (out of scope for verification).

### Per-Operator activation flow

| Step | Actor | Action |
| --- | --- | --- |
| 1 | Operator | Enters E.164 number in app. |
| 2 | Operator | Checks opt-in box: clearly states business name and that they agree to receive WhatsApp messages from the app (Meta requirements). ([Meta opt-in](https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in/)) |
| 3 | App | Validates E.164 format. |
| 4 | App → Twilio | `POST /v2/Services/{VA}/Verifications` with `To={E.164}`, `Channel=whatsapp`, `Locale=fr`. ([Verify API](https://www.twilio.com/docs/verify/api/verification), [WhatsApp overview](https://www.twilio.com/docs/verify/whatsapp)) |
| 5 | Twilio → Operator | WhatsApp Authentication (Copy Code) message in French from your branded sender. |
| 6 | Operator | Enters OTP in app (or uses Copy Code button in WhatsApp). |
| 7 | App → Twilio | `POST /v2/Services/{VA}/VerificationCheck` with `To={E.164}`, `Code={otp}`. ([Verification Check](https://www.twilio.com/docs/verify/api/verification-check)) |
| 8 | App | On `status=approved` and `valid=true`: persist `whatsapp_verified_at`, `whatsapp_e164`, `whatsapp_opt_in_at`; mark Operator eligible as Recipient for Delivery. |
| 9 | App | On failure: show retry; do not enqueue Utility reminder Delivery to unverified numbers. |

### Optional fallback

Enable SMS on the same Verify Service so Twilio can fall back from WhatsApp when the channel is unavailable ([fallback changelog](https://www.twilio.com/en-us/changelog/Verify_Fallback_Scenarios)). This proves phone ownership but not WhatsApp inbox access — treat as degraded path and re-prompt for WhatsApp verification before Utility Delivery.

---

## Template requirements

Verification and reminders use **different Meta template categories**. Do not conflate them.

### Ownership verification (Twilio Verify)

| Attribute | Requirement | Source |
| --- | --- | --- |
| **Category** | **Authentication** only | [Meta authentication guidelines](https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines/) |
| **Template type** | Copy Code Authentication (`otp_type: COPY_CODE`) | [Meta copy-code templates](https://developers.facebook.com/docs/whatsapp/business-management-api/authentication-templates/copy-code-button-authentication-templates/) |
| **Who creates it** | Twilio Verify auto-creates `verify_auto_created` in 71 languages after BYO sender setup | [Verification templates](https://www.twilio.com/docs/verify/verification-templates) |
| **Body text** | Fixed preset: `<VERIFICATION_CODE> is your verification code.` (localized) — not customizable | [Meta authentication templates](https://developers.facebook.com/docs/whatsapp/business-management-api/authentication-templates/) |
| **French locale** | Verify `Locale=fr` → WhatsApp locale `fr`; copy button "Copier le code" | [Supported languages](https://www.twilio.com/docs/verify/supported-languages) |
| **Approval** | Must show **Approved** in Content Template Builder before sending | [Verification templates](https://www.twilio.com/docs/verify/verification-templates) |
| **Sender** | Your own WABA sender (BYO); Meta requires own sender since 2024-03-01 | [Verify WhatsApp](https://www.twilio.com/docs/verify/whatsapp), [BYO](https://www.twilio.com/docs/verify/whatsapp/byo) |
| **PSD2 / custom body** | Not supported on Verify WhatsApp — use Programmable Messaging API instead | [Verify WhatsApp FAQ](https://www.twilio.com/docs/verify/whatsapp) |

### Reminder Delivery (already decided — separate from verification)

| Attribute | Requirement | Source |
| --- | --- | --- |
| **Category** | **Utility** | [Twilio key concepts](https://www.twilio.com/docs/whatsapp/key-concepts) |
| **Use** | Due Reminder notifications to verified Recipients only | App domain |
| **French** | Approved French Utility templates in Content Editor | [Template approvals](https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses) |
| **Outside 24h window** | Required for business-initiated sends | [WhatsApp API overview](https://www.twilio.com/docs/whatsapp/api) |

### What not to do

- **Do not** put OTPs or verification codes in Utility templates. Meta: "Only authentication templates can be used to send a one-time passcode for identity verification." ([Meta categorization](https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines/))
- **Do not** use Utility "Opt-In Management" templates as the primary ownership proof — that category is for confirming opt-in collected elsewhere ([Meta Utility guidelines](https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines/)).

---

## Error handling and edge cases

### Twilio Verify API

| Condition | Behavior | Handling |
| --- | --- | --- |
| Wrong OTP | `VerificationCheck` returns `status: pending`, `valid: false` | Allow retry; max **5** check attempts per verification ([60202](https://www.twilio.com/docs/api/errors/60202)) |
| Max check attempts | HTTP 429, error 60202; verification SID deleted | Start new verification after 10-minute expiry ([60202](https://www.twilio.com/docs/api/errors/60202)) |
| Verification expired | 10-minute TTL; check returns 404 | Start new verification ([Verification Check](https://www.twilio.com/docs/verify/api/verification-check)) |
| Max send attempts | HTTP 429, error 60203 — >5 sends to same number in 10 min without completing lifecycle | Wait for expiry or cancel via Verification Update ([60203](https://www.twilio.com/docs/api/errors/60203)) |
| Verification SID deleted after approve/expiry/max checks | 404 / 60431 on subsequent checks | Treat as terminal; use Verify Logs ([60431](https://www.twilio.com/docs/api/errors/60431)) |
| Verify WhatsApp misconfigured (missing MG, wrong sender) | Error 63008 | Fix Verify Service → WhatsApp tab Messaging Service ([BYO](https://www.twilio.com/docs/verify/whatsapp/byo), [63008](https://www.twilio.com/docs/api/errors/63008)) |
| WhatsApp rate / throughput exceeded | Error 63018 | Back off; respect per-sender limits ([63018](https://www.twilio.com/docs/api/errors/63018)) |

### WhatsApp delivery

| Condition | Behavior | Handling |
| --- | --- | --- |
| Number not on WhatsApp / invalid `To` | Error 63003 | Prompt Operator to install WhatsApp or correct number ([63003](https://www.twilio.com/docs/api/errors/63003)) |
| User blocked business | Error 63014 | Cannot verify via WhatsApp; offer unblock instructions or alternate channel ([debugging tools](https://www.twilio.com/docs/messaging/guides/debugging-tools)) |
| WhatsApp channel down / misconfigured | Verify may auto-fallback to SMS (default since 2025-04-24 if SMS enabled) | Log channel used; require WhatsApp-specific re-verification before Utility Delivery ([fallback changelog](https://www.twilio.com/en-us/changelog/Verify_Fallback_Scenarios)) |
| India destination | Verify WhatsApp falls back to SMS | Document in UX ([verification templates](https://www.twilio.com/docs/verify/verification-templates)) |

### Application-level edge cases

| Edge case | Mitigation |
| --- | --- |
| Operator mistypes E.164 | OTP goes to wrong number; wrong person could approve. Mitigate with "confirm your number" UI before send ([Verify best practices](https://www.twilio.com/docs/verify/whatsapp)). |
| Operator changes number after verification | Invalidate prior verification; require re-verification on E.164 change. |
| Verification passes but opt-in not recorded | Block Delivery — Meta requires opt-in before messaging ([Meta opt-in](https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in/)). |
| Same sender for OTP and Utility reminders | Allowed; Twilio recommends separate sender for OTP vs **marketing** to avoid block risk ([BYO](https://www.twilio.com/docs/verify/whatsapp/byo)). Monitor quality rating. |
| Reminder sent outside 24h customer-service window | Use approved French Utility template via `ContentSid` — free-form Body fails with 63016 ([63016](https://www.twilio.com/docs/api/errors/63016)) |
| Operator never completed click-to-WhatsApp (if offered as UX aid) | Timeout pending verification; do not activate Recipient |

### Click-to-WhatsApp (if used as supplementary UX only)

| Condition | Handling |
| --- | --- |
| Inbound `From` ≠ entered E.164 | Reject activation; ask Operator to re-enter number or resend from correct account ([WhatsApp API](https://www.twilio.com/docs/whatsapp/api)) |
| Prefilled message edited / token missing | Reject; require exact prefilled payload (`wa.me` deep link) ([message features](https://www.twilio.com/docs/whatsapp/message-features)) |
| Template in `wa.me` link rejected by Meta | Do not embed `wa.me` links inside Utility templates ([template rejections](https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses)) |

---

## Option deep-dives

### Option 1 — Twilio Verify WhatsApp OTP ✅ Recommended

Twilio Verify delivers OTPs via Meta **Authentication** templates from your BYO sender. Meta explicitly requires Authentication templates for OTPs ([BYO](https://www.twilio.com/docs/verify/whatsapp/byo), [Meta categorization](https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines/)). Verify orchestrates create/check, auto-provisions Copy Code templates including French, and exposes setup errors via API ([BYO error codes](https://www.twilio.com/docs/verify/whatsapp/byo)).

**Limitations:** Does not replace opt-in disclosure. No PSD2/custom template text on Verify WhatsApp ([Verify WhatsApp](https://www.twilio.com/docs/verify/whatsapp)). Does not support WhatsApp usernames/BSUID ([Verify WhatsApp FAQ](https://www.twilio.com/docs/verify/whatsapp)).

### Option 2 — Click-to-WhatsApp opt-in ⚠️ Supplement only

`wa.me` deep links let users initiate conversation without a template ([message features](https://www.twilio.com/docs/whatsapp/message-features)). Inbound message opens a 24-hour customer-service window for free-form replies ([WhatsApp API](https://www.twilio.com/docs/whatsapp/api)). Twilio documents QR/short links for **collecting opt-in** ([message features](https://www.twilio.com/docs/whatsapp/message-features)).

**Why not primary:** Proves the messaging `From` address, not the E.164 typed in a form unless you strictly match them. Higher drop-off (requires leaving app). Does not send to a declared number — user must complete action on device. Meta opt-in still requires business-name disclosure in surrounding UX ([Meta opt-in](https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in/)).

**Viable use:** Secondary "Open WhatsApp to verify" button alongside OTP, or post-verification engagement — not sole ownership proof.

### Option 3 — Utility template ping + confirmation ❌ Not recommended

Sending a business-initiated confirmation before opt-in conflicts with Meta's opt-in-first requirement unless opt-in was already collected on another channel ([Meta opt-in](https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in/), [Twilio opt-in warning](https://www.twilio.com/docs/whatsapp/api)). Utility "Opt-In Management" templates confirm opt-in from **other channels**, not primary identity proof ([Meta Utility guidelines](https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines/)).

If the ping contains a one-time code, Meta forbids Utility/Marketing for that purpose — **Authentication only** ([Meta categorization](https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines/)). A keyword reply ("OUI") proves some WhatsApp user replied, not that they control the E.164 entered in the app.

### Option 4 — Hybrid (Verify OTP + in-app opt-in) ✅ Target architecture

Combines option 1 (Authentication OTP for ownership) with explicit in-app opt-in copy (Meta requirement). French Utility templates remain dedicated to Reminder Delivery. This is the recommended production design.

---

## French locale notes

| Concern | Detail |
| --- | --- |
| Verify OTP language | Pass `Locale=fr` on Verification create; maps to WhatsApp locale `fr` with button label "Copier le code" ([supported languages](https://www.twilio.com/docs/verify/supported-languages)) |
| Authentication body | Meta preset text is auto-localized; body is not customizable ([authentication templates](https://developers.facebook.com/docs/whatsapp/business-management-api/authentication-templates/)) |
| Reminder Utility templates | Separate French Utility templates (already planned); unrelated to verification |
| Opt-in UI copy | Must be in French for French Operators — state business name and consent per Meta ([Meta opt-in](https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in/)) |
| Pricing region | France Meta region applies to template fees ([WhatsApp pricing](https://www.twilio.com/en-us/whatsapp/pricing)) |

---

## Citations index

| Topic | URL |
| --- | --- |
| Twilio Verify WhatsApp overview | https://www.twilio.com/docs/verify/whatsapp |
| Twilio Verify BYO WhatsApp Sender | https://www.twilio.com/docs/verify/whatsapp/byo |
| Twilio Verify API — Verifications | https://www.twilio.com/docs/verify/api/verification |
| Twilio Verify API — Verification Check | https://www.twilio.com/docs/verify/api/verification-check |
| Twilio Verify verification templates | https://www.twilio.com/docs/verify/verification-templates |
| Twilio Verify supported languages (French `fr`) | https://www.twilio.com/docs/verify/supported-languages |
| Twilio Verify WhatsApp→SMS fallback | https://www.twilio.com/en-us/changelog/Verify_Fallback_Scenarios |
| Twilio WhatsApp API overview (opt-in, 24h window) | https://www.twilio.com/docs/whatsapp/api |
| Twilio WhatsApp message features (wa.me deep links) | https://www.twilio.com/docs/whatsapp/message-features |
| Twilio WhatsApp template approvals & categorization | https://www.twilio.com/docs/whatsapp/tutorial/message-template-approvals-statuses |
| Twilio WhatsApp key concepts (template categories) | https://www.twilio.com/docs/whatsapp/key-concepts |
| Twilio WhatsApp self sign-up | https://www.twilio.com/docs/whatsapp/self-sign-up |
| Twilio error 60202 (max check attempts) | https://www.twilio.com/docs/api/errors/60202 |
| Twilio error 60203 (max send attempts) | https://www.twilio.com/docs/api/errors/60203 |
| Twilio error 60431 (verification not found) | https://www.twilio.com/docs/api/errors/60431 |
| Twilio error 63003 (invalid To address) | https://www.twilio.com/docs/api/errors/63003 |
| Twilio error 63008 (channel misconfigured) | https://www.twilio.com/docs/api/errors/63008 |
| Twilio error 63014 (blocked by user) | https://www.twilio.com/docs/messaging/guides/debugging-tools |
| Twilio error 63016 (outside messaging window) | https://www.twilio.com/docs/api/errors/63016 |
| Twilio error 63018 (rate limit) | https://www.twilio.com/docs/api/errors/63018 |
| Meta — getting opt-in | https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in/ |
| Meta — template categorization | https://developers.facebook.com/docs/whatsapp/updates-to-pricing/new-template-guidelines/ |
| Meta — authentication templates | https://developers.facebook.com/docs/whatsapp/business-management-api/authentication-templates/ |
| Meta — copy-code authentication templates | https://developers.facebook.com/docs/whatsapp/business-management-api/authentication-templates/copy-code-button-authentication-templates/ |
| Meta — service messages / customer service window | https://developers.facebook.com/docs/whatsapp/conversation-types/ |
