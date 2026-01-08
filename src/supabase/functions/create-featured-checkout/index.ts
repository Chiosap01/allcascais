// supabase/functions/create-featured-checkout/index.ts
import Stripe from "npm:stripe@16.12.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PRICE_BY_DAYS: Record<number, number> = {
  7: 199,
  14: 399,
  30: 599,
};

Deno.serve(async (req: Request): Promise<Response> => {
  // ✅ Always answer preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // ✅ Always include CORS headers even on 405
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY");
    const SITE_URL = Deno.env.get("SITE_URL");

    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY || !SITE_URL) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = authData.user;

    const body = await req.json();
    const property_id = String(body.property_id ?? "");
    const plan_days = Number(body.plan_days ?? 0);

    if (!property_id || ![7, 14, 30].includes(plan_days)) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const amount_cents = PRICE_BY_DAYS[plan_days];
    if (!amount_cents) {
      return new Response(JSON.stringify({ error: "Invalid plan" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: listing, error: listingErr } = await supabase
      .from("property_listings")
      .select("id, user_id")
      .eq("id", property_id)
      .maybeSingle();

    if (listingErr || !listing || listing.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Listing not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Order create failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const successUrl = `${SITE_URL}/featured/success?order_id=${order.id}`;
    const cancelUrl = `${SITE_URL}/featured/cancel?order_id=${order.id}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      currency: "eur",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: amount_cents,
            product_data: { name: `Destaque de anúncio (${plan_days} dias)` },
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

    await supabase
      .from("featured_orders")
      .update({
        provider_payment_id: session.id,
        provider_request_id: session.payment_intent
          ? String(session.payment_intent)
          : null,
      })
      .eq("id", order.id);

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
