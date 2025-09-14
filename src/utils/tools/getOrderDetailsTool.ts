import z from "zod"

const API_BASE = process.env.PAYPAL_SANDBOX === "false" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com"

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID || ""
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || ""
  if (!clientId || !clientSecret) {
    throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET")
  }
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const tokenUrl = `${API_BASE}/v1/oauth2/token`
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
    cache: "no-store",
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to get token: ${res.status} ${text}`)
  }
  const data = await res.json()
  return data.access_token as string
}

export class GetOrderDetailsTool {
  async get({ orderId }: { orderId: string }) {
    const token = await getAccessToken()
    const url = `${API_BASE}/v2/checkout/orders/${orderId}`
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })
    const text = await resp.text()
    let json: any
    try { json = JSON.parse(text) } catch { json = { raw: text } }
    if (!resp.ok) {
      return { ok: false, error: json }
    }
    return { ok: true, data: json }
  }

  getTools() {
    return {
      get_order_details: {
        description: "Get PayPal order details by orderId via Orders API (server-side).",
        parameters: z.object({ orderId: z.string() }),
        execute: this.get.bind(this),
      },
      // 别名：get_order
      get_order: {
        description: "Alias of get_order_details: fetch order details by orderId via Orders API.",
        parameters: z.object({ orderId: z.string() }),
        execute: this.get.bind(this),
      },
    }
  }
}
