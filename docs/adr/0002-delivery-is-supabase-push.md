# Delivery is a push from the due-check Edge Function, not Twilio WhatsApp

Twilio WhatsApp Utility (sender registration, Meta template approval, Verify OTP) was the Delivery channel. Sender and template configuration was blocking progress, so this effort sends Delivery as a push from the due-check Edge Function, using Supabase's documented Edge Function push path. WhatsApp Utility is parked; it is not the v1 send path.

**Considered options:** Keep Twilio and wait on Meta/Twilio approval — rejected because configuration was costing time with no send path yet. Assume Expo native-only push — not assumed; this app is a Vercel Next.js web app, so Web Push / FCM-for-web is in play (which stack is a research ticket). SQL-side send — still rejected ([ADR-0001](./0001-due-check-hybrid-cron.md)): error taxonomy and TDD for send stay in TypeScript.

**Consequences:** Recipients no longer need a WhatsApp number. Reachability is a device permission / push token, not E.164 proof. Closed WhatsApp tickets are off the route. ADR-0001's hybrid cron is unchanged; only the send target in the Edge Function changes.
