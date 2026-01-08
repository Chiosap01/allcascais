// supabase/functions/stripe-webhook/index.ts
import Stripe from "npm:stripe@16.12.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) return new Response("Missing signature", { status: 400 });

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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const order_id = session.metadata?.order_id;
      const property_id = session.metadata?.property_id;
      const plan_days = Number(session.metadata?.plan_days ?? 0);

      if (!order_id || !property_id || ![7, 14, 30].includes(plan_days)) {
        return new Response("Missing metadata", { status: 200 });
      }

      const { data: order, error: orderErr } = await supabase
        .from("featured_orders")
        .select("id, status")
        .eq("id", order_id)
        .maybeSingle();

      if (orderErr || !order)
        return new Response("Order not found", { status: 200 });

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
              : "",
          })
          .eq("id", order_id);
      }

      const { data: listing } = await supabase
        .from("property_listings")
        .select("id, featured_until")
        .eq("id", property_id)
        .maybeSingle();

      if (listing) {
        const now = new Date();
        const base = listing.featured_until
          ? new Date(listing.featured_until)
          : null;
        const start = base && base > now ? base : now;

        const newUntil = new Date(start);
        newUntil.setDate(newUntil.getDate() + plan_days);

        await supabase
          .from("property_listings")
          .update({ featured_until: newUntil.toISOString() })
          .eq("id", property_id);
      }
    }

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("server error", { status: 500 });
  }
});
