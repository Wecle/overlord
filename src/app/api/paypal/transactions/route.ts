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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const daysParam = url.searchParams.get("days")
    const startParam = url.searchParams.get("start_date")
    const endParam = url.searchParams.get("end_date")

    let start_date: string
    let end_date: string

    if (startParam && endParam) {
      start_date = startParam
      end_date = endParam
    } else {
      const days = Math.max(1, Math.min(90, Number(daysParam) || 30))
      const now = new Date()
      const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      start_date = iso(start)
      end_date = iso(now)
    }

    const token = await getAccessToken()

    const qs = new URLSearchParams({
      start_date,
      end_date,
      fields: "transaction_info,cart_info,payer_info",
      page_size: "200",
    })
    const resp = await fetch(`${API_BASE}/v1/reporting/transactions?${qs.toString()}`, {
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

    let fallback: any = null
    try {
      const details: any[] = json?.transaction_details || []
      if (!Array.isArray(details) || details.length === 0) {
        // 回退：扩大检索窗口（最多90天）并按最近更新排序取1条
        const now = new Date()
        const start90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        const qs2 = new URLSearchParams({
          start_date: iso(start90),
          end_date: iso(now),
          fields: "transaction_info,cart_info,payer_info",
          page_size: "200",
        })
        const resp2 = await fetch(`${API_BASE}/v1/reporting/transactions?${qs2.toString()}`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          cache: "no-store",
        })
        const text2 = await resp2.text()
        let json2: any
        try { json2 = JSON.parse(text2) } catch { json2 = { raw: text2 } }
        if (resp2.ok) {
          const details2: any[] = json2?.transaction_details || []
          if (Array.isArray(details2) && details2.length > 0) {
            const sorted = details2.sort((a: any, b: any) => {
              const ad = new Date(a?.transaction_info?.transaction_updated_date || a?.transaction_info?.transaction_initiation_date || 0).getTime()
              const bd = new Date(b?.transaction_info?.transaction_updated_date || b?.transaction_info?.transaction_initiation_date || 0).getTime()
              return bd - ad
            })
            fallback = { lastSubmitted: sorted[0] }
          }
        }
      }
    } catch {}

    return NextResponse.json({ ok: true, data: json, fallback })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 })
  }
}
