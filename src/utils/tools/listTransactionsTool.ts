import z from "zod"

const API_BASE = "https://api-m.sandbox.paypal.com"

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

function iso(date: Date) {
  return date.toISOString().slice(0, 19) + "Z"
}

export class ListTransactionsTool {
  async listRecent({ days }: { days?: number }) {
    const d = Math.max(1, Math.min(90, days || 30))
    const now = new Date()
    const start = new Date(now.getTime() - d * 24 * 60 * 60 * 1000)
    const start_date = iso(start)
    const end_date = iso(now)

    const token = await getAccessToken()
    const qs = new URLSearchParams({
      start_date,
      end_date,
      fields: "transaction_info,cart_info,payer_info",
      page_size: "200",
    })
    const url = `${API_BASE}/v1/reporting/transactions?${qs.toString()}`
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
    const def = {
      description: "List recent PayPal transactions directly via reporting API (server-side). Optional days (1-90).",
      parameters: z.object({ days: z.number().min(1).max(90).optional() }),
      execute: this.listRecent.bind(this),
    }
    return {
      list_transactions: def,
      list_recent_transactions: def,
    }
  }
}
