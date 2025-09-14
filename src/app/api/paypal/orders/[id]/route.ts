import { NextResponse } from "next/server"

const API_BASE = "https://api-m.sandbox.paypal.com"

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID || ""
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || ""
  if (!clientId || !clientSecret) {
    throw new Error("Missing PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET")
  }
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const res = await fetch(`${API_BASE}/v1/oauth2/token`, {
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

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  try {
    const orderId = ctx?.params?.id
    if (!orderId) {
      return NextResponse.json({ ok: false, error: "Missing orderId" }, { status: 400 })
    }

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
      return NextResponse.json({ ok: false, error: json }, { status: resp.status })
    }

    return NextResponse.json({ ok: true, data: json })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
