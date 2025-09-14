import { putShareData } from "@/server/shortStore"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const encoded: string | undefined = body?.d
    if (!encoded || typeof encoded !== "string") {
      return new Response(JSON.stringify({ error: "missing d" }), { status: 400 })
    }
    const id = putShareData(encoded)
    return new Response(JSON.stringify({ id, url: `/s/${id}` }), {
      status: 200,
      headers: { "content-type": "application/json" },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "bad request" }), { status: 400 })
  }
}


