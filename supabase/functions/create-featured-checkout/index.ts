// Deno / Supabase Edge Function
import Stripe from "https://esm.sh/stripe@16.12.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

const PRICE_BY_DAYS: Record<number, number> = {
  7: 199, // cents
  14: 399,
  30: 599,
};

Deno.serve(async (req: Request): Promise<Response> => {
  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } },
    });

    // Auth: get user from JWT
    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const user = authData.user;

    const body = await req.json();
    const property_id = String(body.property_id || "");
    const plan_days = Number(body.plan_days || 0);

    if (!property_id || ![7, 14, 30].includes(plan_days)) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const amount_cents = PRICE_BY_DAYS[plan_days];
    if (!amount_cents) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Ensure property belongs to user
    const { data: listing, error: listingErr } = await supabase
      .from("property_listings")
      .select("id, user_id")
      .eq("id", property_id)
      .maybeSingle();

    if (listingErr || !listing || listing.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Listing not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create pending order
    const { data: order, error: orderErr } = await supabase
      .from("featured_orders")
      .insert({
        user_id: user.id,
        property_id,
        plan_days,
        amount_cents,
        currency: "EUR",
        status: "pending",
        provider: "stripe",
      })
      .select("id")
      .single();

    if (orderErr) {
      return new Response(JSON.stringify({ error: "Order create failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const siteUrl = Deno.env.get("SITE_URL");
    const successUrl = `${siteUrl}/featured/success?order_id=${order.id}`;
    const cancelUrl = `${siteUrl}/featured/cancel?order_id=${order.id}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "eur",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amount_cents,
            product_data: {
              name: `Destaque de anúncio (${plan_days} dias)`,
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        order_id: order.id,
        property_id,
        plan_days: String(plan_days),
        user_id: user.id,
      },
    });

    // Store session id
    await supabase
      .from("featured_orders")
      .update({
        provider_payment_id: session.id,
        provider_request_id: session.payment_intent as string | null,
      })
      .eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
