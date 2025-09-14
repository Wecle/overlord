import { getShareData } from "@/server/shortStore"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { id } = await params
  const d = id ? getShareData(id) : null
  if (!d) {
    return new Response(JSON.stringify({ error: "not found" }), { status: 404 })
  }
  return new Response(JSON.stringify({ d }), {
    status: 200,
    headers: { "content-type": "application/json" },
  })
}


