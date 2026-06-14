import Stripe from "stripe"

const key = process.env.STRIPE_SECRET_KEY
if (!key) throw new Error("Set STRIPE_SECRET_KEY env var before running this script")
const stripe = new Stripe(key)

async function main() {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: "Test" },
            unit_amount: 5000,
          },
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000/success",
      cancel_url: "http://localhost:3000/cancel",
      metadata: { appointmentId: "test-001" },
    })
    console.log("payment_intent:", JSON.stringify(session.payment_intent))
    console.log("url:", session.url ? "OK" : "NULL")
    console.log("id:", session.id)
  } catch (e: unknown) {
    console.error("ERR:", (e as Error).message)
  }
}

main()
