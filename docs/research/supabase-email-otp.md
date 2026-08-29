# Does Supabase Auth email OTP give a magic link and a 6-digit code in one mail?

**Ticket:** [#4](https://github.com/Yvens16/baby-planning/issues/4)
**Question:** Sign-in is one email, two completions: tap a magic link or type a 6-digit OTP. Does current Supabase Auth support that in a single mail and a single flow? What APIs and settings does it take? Any Next.js / SSR gotchas?

**Answer:** Yes. Magic Link and email OTP are the same `signInWithOtp` send path and the same Magic Link template. The mailer always injects both `{{ .ConfirmationURL }}` (and `{{ .TokenHash }}`) and the plaintext `{{ .Token }}`. The default template only renders the link; put both variables in that one template to offer tap-or-type. Completing either path consumes the same one-time token.

Client docs frame this as “link **or** code” because they describe switching the template. They do not document a second send API, and they do not forbid including both variables.

---

## 1. One send, two completions

Passwordless email login is Magic Link or OTP. Both use the user's email. The client method is labeled OTP; it sends a Magic Link by default. The two methods differ only in the confirmation email content. ([Passwordless email logins](https://supabase.com/docs/guides/auth/auth-email-passwordless))

`signInWithOtp` logs in with a magic link or an OTP. If the template includes `{{ .ConfirmationURL }}`, a magic link is sent. If it includes `{{ .Token }}`, an OTP is sent. Magic links and OTPs share the same implementation. To send a one-time code instead of a link, change the Magic Link template to include `{{ .Token }}` instead of `{{ .ConfirmationURL }}`. ([JS `signInWithOtp`](https://supabase.com/docs/reference/javascript/auth-signinwithotp))

Email OTPs share an implementation with Magic Links. To send an OTP instead of a Magic Link, alter the Magic Link email template and include `{{ .Token }}`. ([Passwordless email logins — With OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless))

The Magic Link template is sent for both a magic-link request and an email OTP request. ([Customizing email templates — `auth.email.template.magic_link`](https://supabase.com/docs/guides/local-development/customizing-email-templates))

There is no separate “send magic link” vs “send email OTP” JavaScript call. One `signInWithOtp({ email })` produces one Magic Link mail. What the user sees is the template.

---

## 2. The mailer already has both variables

`MagicLinkMail` passes this data into a single template render:

- `ConfirmationURL`
- `Token` (the raw OTP)
- `TokenHash` (hash of email + OTP, stored on the user)
- `SiteURL`, `Email`, `Data`, `RedirectTo`

([`templatemailer.go` `MagicLinkMail`](https://github.com/supabase/auth/blob/master/internal/mailer/templatemailer/templatemailer.go))

`sendMagicLink` generates one OTP, hashes it, stores the hash on `user.RecoveryToken`, and sends `MagicLinkVerification` with that OTP. ([`internal/api/mail.go` `sendMagicLink`](https://github.com/supabase/auth/blob/master/internal/api/mail.go))

Hosted template variables ([Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)):

| Variable | Role |
| --- | --- |
| `{{ .ConfirmationURL }}` | Auth verify URL, e.g. `https://<project-ref>.supabase.co/auth/v1/verify?token={{ .TokenHash }}&type=email&redirect_to=…` |
| `{{ .Token }}` | One-time password that can be used instead of `{{ .ConfirmationURL }}` |
| `{{ .TokenHash }}` | Hashed token, for building your own link |
| `{{ .SiteURL }}` | Project Site URL |
| `{{ .RedirectTo }}` | Redirect passed to `signInWithOtp` (must be on the allow list) |

The default Magic Link body is link-only: “Follow the link below to sign in” + `{{ .ConfirmationURL }}`. ([Email Templates Management API example](https://supabase.com/docs/guides/auth/auth-email-templates); [default Magic Link body in `templatemailer.go`](https://github.com/supabase/auth/blob/master/internal/mailer/templatemailer/templatemailer.go))

To offer both completions in one mail, customize **Magic link** (dashboard: Email Templates; local: `auth.email.template.magic_link`) to include a link **and** `{{ .Token }}`. Official copy says “instead of” when showing how to switch from the default link-only mail to a code-only mail. Both keys are always in the template data, so one customized mail can render both.

Example (implicit / default `ConfirmationURL`):

```html
<h2>Sign in to your account</h2>
<p><a href="{{ .ConfirmationURL }}">Sign in</a></p>
<p>Or enter this code: {{ .Token }}</p>
```

Example (PKCE / Next.js SSR — see §5):

```html
<h2>Sign in to your account</h2>
<p>
  <a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}">
    Sign in
  </a>
</p>
<p>Or enter this code: {{ .Token }}</p>
```

The second shape is the official PKCE Magic Link pattern plus the official OTP `{{ .Token }}` variable. ([Passwordless — PKCE template](https://supabase.com/docs/guides/auth/auth-email-passwordless); [password-based Auth PKCE signup template, same `token_hash` pattern](https://supabase.com/docs/guides/auth/passwords); [Email Templates — `TokenHash`](https://supabase.com/docs/guides/auth/auth-email-templates))

---

## 3. APIs

### Send: `supabase.auth.signInWithOtp`

```ts
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'valid.email@supabase.io',
  options: {
    shouldCreateUser: false, // default is true: unknown emails are signed up
    emailRedirectTo: 'https://example.com/welcome',
  },
})
```

On success, `user` and `session` are both `null`. The user must complete via link or typed code. ([Passwordless email logins](https://supabase.com/docs/guides/auth/auth-email-passwordless); [JS `signInWithOtp`](https://supabase.com/docs/reference/javascript/auth-signinwithotp))

Relevant options:

- `email` — required for this flow. PKCE is supported when an email is passed. ([JS `signInWithOtp`](https://supabase.com/docs/reference/javascript/auth-signinwithotp); [SSR advanced guide — PKCE support](https://supabase.com/docs/guides/auth/server-side/advanced-guide))
- `options.shouldCreateUser` — default `true`. Set `false` to refuse unknown emails. ([Passwordless](https://supabase.com/docs/guides/auth/auth-email-passwordless))
- `options.emailRedirectTo` — becomes `{{ .RedirectTo }}`. Must be on the Redirect URLs allow list (or Site URL). ([Passwordless — Enabling Magic Link](https://supabase.com/docs/guides/auth/auth-email-passwordless); [Email Templates — `RedirectTo`](https://supabase.com/docs/guides/auth/auth-email-templates))
- `options.captchaToken` — if CAPTCHA is enabled. (client library option; see JS reference)

Resend a passwordless email by calling `signInWithOtp()` again, not `resend()`. `resend()` is for signup confirmation, email change, and phone change. ([JS `resend`](https://supabase.com/docs/reference/javascript/auth-resend))

### Complete by typing the code: `supabase.auth.verifyOtp`

```ts
const { data: { session }, error } = await supabase.auth.verifyOtp({
  email: 'email@example.com',
  token: '123456',
  type: 'email',
})
```

Use type `email` for sign-up or sign-in OTP. Types `signup` and `magiclink` are deprecated. ([JS `verifyOtp`](https://supabase.com/docs/reference/javascript/auth-verifyotp); [Passwordless — Step 2](https://supabase.com/docs/guides/auth/auth-email-passwordless))

On PKCE, a successful email/phone OTP verify still returns the access token in the response body (same as implicit). ([SSR advanced guide — “Which authentication flows have PKCE support?”](https://supabase.com/docs/guides/auth/server-side/advanced-guide))

### Complete by tapping the link

**Implicit (default `{{ .ConfirmationURL }}`):** Auth `/verify` consumes the token and redirects to `redirect_to` with the session in the **URL fragment**. The server cannot read fragments. ([Email Templates — Redirecting the user to a server-side endpoint](https://supabase.com/docs/guides/auth/auth-email-templates); [Passwordless — “That’s it for the implicit flow”](https://supabase.com/docs/guides/auth/auth-email-passwordless))

**PKCE / SSR:** Put `token_hash` + `type=email` on your own `/auth/confirm` URL, then exchange on the server:

```ts
await supabase.auth.verifyOtp({
  token_hash,
  type: 'email',
})
```

([Passwordless — PKCE](https://supabase.com/docs/guides/auth/auth-email-passwordless); [Email Templates — `verifyOtp` with `token_hash`](https://supabase.com/docs/guides/auth/auth-email-templates); [JS `verifyOtp` — TokenHash for PKCE / Server Side Auth](https://supabase.com/docs/reference/javascript/auth-verifyotp))

Magic Links are one-time use. ([Passwordless — With Magic Link](https://supabase.com/docs/guides/auth/auth-email-passwordless)) Link and typed code are the same OTP (`Token` vs hash of that `Token`), so using one completion invalidates the other.

---

## 4. Settings

Email auth, including Magic Links and email OTPs, is enabled by default. ([Passwordless](https://supabase.com/docs/guides/auth/auth-email-passwordless))

| Setting | What it does | Source |
| --- | --- | --- |
| **Site URL** and **Redirect URLs** | Only allowed post-click destinations. Configure in dashboard URL Configuration, `config.toml`, or self-hosted env. | [Passwordless — Enabling Magic Link](https://supabase.com/docs/guides/auth/auth-email-passwordless) |
| **Magic Link email template** | Single template for link and/or code. Hosted: dashboard Email Templates. Local: `auth.email.template.magic_link`. API: `mailer_subjects_magic_link`, `mailer_templates_magic_link_content`. | [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates); [Customizing email templates](https://supabase.com/docs/guides/local-development/customizing-email-templates) |
| **Email OTP expiration** | Dashboard: Authentication → Sign In / Providers → Email → Email OTP expiration. Also governs Magic Links and other email links (confirm, recovery, email change, invite). Hosted product default: 1 hour. More than 86,400s (one day) is discouraged and only via Management API. | [Passwordless — Enabling email OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless) |
| **OTP expiry (local)** | `auth.email.otp_expiry`, default `3600` seconds. | [CLI config](https://supabase.com/docs/guides/local-development/cli/config) |
| **OTP expiry (Auth binary fallback)** | If `Mailer.OtpExp` is unset/`0`, gotrue defaults to `86400`. Hosted/CLI defaults above override this. | [`configuration.go`](https://github.com/supabase/auth/blob/master/internal/conf/configuration.go) |
| **OTP length** | Default **6** digits. Allowed **6–10**. Local: `auth.email.otp_length`. Hosted API: `mailer_otp_length`. Auth clamps out-of-range to 6. | [CLI config](https://supabase.com/docs/guides/local-development/cli/config); [Management API update auth config](https://supabase.com/docs/reference/api/v1-update-auth-service-config); [`configuration.go`](https://github.com/supabase/auth/blob/master/internal/conf/configuration.go); [Passwordless](https://supabase.com/docs/guides/auth/auth-email-passwordless) (“six digit”); [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates) (`{{ .Token }}` is a 6-digit OTP) |
| **Send rate** | Default: one request every 60 seconds (`SMTP.MaxFrequency` default 1 minute). Local: `auth.email.max_frequency`. | [Passwordless](https://supabase.com/docs/guides/auth/auth-email-passwordless); [`configuration.go`](https://github.com/supabase/auth/blob/master/internal/conf/configuration.go); [CLI config](https://supabase.com/docs/guides/local-development/cli/config) |

**Doc discrepancy on digit count:** the local-dev template glossary says `Token` is an “8-digit” OTP. ([Customizing email templates — Token](https://supabase.com/docs/guides/local-development/customizing-email-templates)) That conflicts with the hosted Email Templates page, the passwordless guide, CLI `auth.email.otp_length` default `6`, and Auth’s clamp to 6. Treat **6** as the default; 8 only if you set `otp_length` / `mailer_otp_length` to 8. Reauthentication mail is a different template (`{{ .Token }}` only).

Management API keys for the same knobs: `mailer_otp_exp`, `mailer_otp_length`, plus `mailer_templates_magic_link_content`. ([Update auth service config](https://supabase.com/docs/reference/api/v1-update-auth-service-config); [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates))

---

## 5. Next.js / SSR gotchas

### PKCE is the default with `@supabase/ssr`

`@supabase/ssr` clients use the PKCE flow by default and store the session in cookies. Implicit flow puts tokens in the URL fragment; the server cannot read that. ([SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide))

`signInWithOtp` (email) supports PKCE. ([JS `signInWithOtp`](https://supabase.com/docs/reference/javascript/auth-signinwithotp); [SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide))

For PKCE Magic Links, official docs say to change the template to a `token_hash` link and exchange it with `verifyOtp`. Do **not** rely on stock `{{ .ConfirmationURL }}` if the session must be established on the server. ([Passwordless — PKCE](https://supabase.com/docs/guides/auth/auth-email-passwordless); [Email Templates — server-side endpoint](https://supabase.com/docs/guides/auth/auth-email-templates))

Typed OTP does not need a redirect: `verifyOtp({ email, token, type: 'email' })` returns the session in the body under both implicit and PKCE. ([SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide); [Passwordless Step 2](https://supabase.com/docs/guides/auth/auth-email-passwordless))

### Confirm route

Official Next.js pattern: `app/auth/confirm/route.ts` reads `token_hash` and `type`, calls `verifyOtp`, then redirects **without** those query params (do not leak the secret in the next URL). ([Next.js tutorial confirm handler](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs); [password-based Auth PKCE Step 2](https://supabase.com/docs/guides/auth/passwords))

Use the cookie SSR client (`createServerClient` from `@supabase/ssr`), not a throwaway browser client, so `verifyOtp` can write session cookies. ([Creating a Supabase client](https://supabase.com/docs/guides/auth/server-side/creating-a-client); [SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide))

### Email prefetch / Safe Links

Some providers prefetch links and consume `{{ .ConfirmationURL }}` immediately (“Token has expired or is invalid”). Official mitigations: put `{{ .Token }}` in the mail and send users to a page that collects email + code (`verifyOtp({ email, token, type: 'email' })`), or wrap the real confirm URL behind a button so prefetch does not hit `/verify`. ([Email Templates — Email prefetching](https://supabase.com/docs/guides/auth/auth-email-templates))

A dual-completion mail that uses **auto-verify** `{{ .ConfirmationURL }}` is exposed to prefetch. A dual-completion mail that uses a **non-verifying** landing link plus `{{ .Token }}`, or a PKCE `/auth/confirm?token_hash=…` GET that you control, is closer to the official prefetch guidance.

### Email tracking

External “email tracking” rewrites links and breaks Auth URLs. Disable tracking on the sending provider. ([Email Templates — Email tracking](https://supabase.com/docs/guides/auth/auth-email-templates))

### Next.js route prefetch vs implicit fragments

If any path still lands tokens in the URL fragment, Next.js `<Link>` / `Router.push` prefetch can hit the server **before** the browser client reads the fragment, so the server renders logged-out. Official advice: after sign-in, land on a page with no Next.js prefetch; then navigate onward. Prefer PKCE `token_hash` + cookies to avoid this class of bug. ([SSR advanced guide — FAQ](https://supabase.com/docs/guides/auth/server-side/advanced-guide))

### Cookies, cache, Fluid compute

- Return the same `NextResponse` that `@supabase/ssr` attached cookies to (middleware / proxy). Cloning without copying cookies drops the session. ([Creating a client / Next.js proxy examples via Context7 from the official Next.js + SSR guides](https://supabase.com/docs/guides/auth/server-side/nextjs))
- Do not ISR or CDN-cache responses that `Set-Cookie` a refreshed session. As of `@supabase/ssr` v0.10.0, `setAll` receives cache headers to apply. ([SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide))
- On Vercel Fluid compute, create the Supabase client **inside** the request handler, not at module scope. ([SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide))

### Identity checks

`getSession()` reads local/cookie storage and does not re-validate with Auth. For identity on the server, use `getClaims()` or `getUser()`. ([Creating a client](https://supabase.com/docs/guides/auth/server-side/creating-a-client); [SSR advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide))

---

## 6. Recommended app shape (not implemented here)

1. Call `signInWithOtp({ email, options: { emailRedirectTo, shouldCreateUser } })` once.
2. Customize the Magic Link template to include a PKCE link (`token_hash` + `type=email`) **and** `{{ .Token }}`.
3. Link path: `GET /auth/confirm` → `verifyOtp({ token_hash, type })` on the SSR cookie client → redirect.
4. Code path: form on the sign-in page → `verifyOtp({ email, token, type: 'email' })`.
5. Set Site URL, Redirect URLs, OTP expiry (1h default), OTP length (6 default). Budget the 60s resend window.

---

## Sources

Primary docs and first-party source only.

- [Passwordless email logins](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Customizing email templates (local)](https://supabase.com/docs/guides/local-development/customizing-email-templates)
- [JS `signInWithOtp`](https://supabase.com/docs/reference/javascript/auth-signinwithotp)
- [JS `verifyOtp`](https://supabase.com/docs/reference/javascript/auth-verifyotp)
- [JS `resend`](https://supabase.com/docs/reference/javascript/auth-resend)
- [Password-based Auth (PKCE email templates + Next.js confirm route)](https://supabase.com/docs/guides/auth/passwords)
- [Server-Side Auth advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Next.js getting-started tutorial (confirm route)](https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs)
- [CLI config — `auth.email.otp_length` / `otp_expiry`](https://supabase.com/docs/guides/local-development/cli/config)
- [Management API — Update auth service config](https://supabase.com/docs/reference/api/v1-update-auth-service-config)
- [supabase/auth `MagicLinkMail` template data](https://github.com/supabase/auth/blob/master/internal/mailer/templatemailer/templatemailer.go)
- [supabase/auth `sendMagicLink`](https://github.com/supabase/auth/blob/master/internal/api/mail.go)
- [supabase/auth `Mailer.OtpLength` / `OtpExp` defaults](https://github.com/supabase/auth/blob/master/internal/conf/configuration.go)
