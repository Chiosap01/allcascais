// supabase/functions/stripe-webhook/index.ts
import Stripe from "npm:stripe@16.12.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");

if (
  !STRIPE_SECRET_KEY ||
  !STRIPE_WEBHOOK_SECRET ||
  !SUPABASE_URL ||
  !SERVICE_ROLE_KEY
) {
  throw new Error("Missing env vars for stripe-webhook");
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function addDaysIso(baseIso: string | null, days: number) {
  const now = new Date();
  const base = baseIso ? new Date(baseIso) : null;
  const start = base && base > now ? base : now;
  const out = new Date(start);
  out.setDate(out.getDate() + days);
  return out.toISOString();
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Stripe doesn't need CORS, but OPTIONS won't hurt
  if (req.method === "OPTIONS") return new Response("ok", { status: 200 });

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature)
      return new Response("Missing stripe-signature", { status: 400 });

    const rawBody = await req.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed", err);
      return new Response("Invalid signature", { status: 400 });
    }

    // Handle immediate + delayed confirmations
    const isPaidEvent =
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded";

    if (isPaidEvent) {
      const session = event.data.object as Stripe.Checkout.Session;

      const order_id = session.metadata?.order_id;
      const property_id = session.metadata?.property_id;
      const plan_days = Number(session.metadata?.plan_days ?? 0);

      if (!order_id || !property_id || ![7, 14, 30].includes(plan_days)) {
        console.warn("Missing/invalid metadata", {
          order_id,
          property_id,
          plan_days,
        });
        return new Response("ok", { status: 200 });
      }

      // 1) Mark order paid (idempotent)
      const { data: order, error: orderErr } = await supabase
        .from("featured_orders")
        .select("id, status")
        .eq("id", order_id)
        .maybeSingle();

      if (orderErr || !order) {
        console.warn("Order not found", { order_id, orderErr });
        return new Response("ok", { status: 200 });
      }

      if (order.status !== "paid") {
        await supabase
          .from("featured_orders")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            provider: "stripe",
            provider_payment_id: session.id,
            provider_request_id: session.payment_intent
              ? String(session.payment_intent)
              : null,
          })
          .eq("id", order_id);
      }

      // 2) Extend featured_until
      const { data: listing, error: listingErr } = await supabase
        .from("property_listings")
        .select("id, featured_until")
        .eq("id", property_id)
        .maybeSingle();

      if (listingErr || !listing) {
        console.warn("Listing not found", { property_id, listingErr });
        return new Response("ok", { status: 200 });
      }

      const newUntil = addDaysIso(listing.featured_until, plan_days);

      await supabase
        .from("property_listings")
        .update({ featured_until: newUntil })
        .eq("id", property_id);
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error("stripe-webhook server error", e);
    return new Response("server error", { status: 500 });
  }
});
