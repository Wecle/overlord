"use client"

import React, { useEffect, useMemo, useState } from "react"
import { getLastPaidOrderId } from "@/utils/paypalSession"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface OrdersOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDate(d?: string) {
  try {
    if (!d) return "—"
    return new Date(d).toLocaleString()
  } catch {
    return d || "—"
  }
}

function isNonPurchase(detail: any): boolean {
  const tx = detail?.transaction_info || {}
  const subject: string = tx?.transaction_subject || ""
  const eventCode: string = tx?.transaction_event_code || ""
  const extendedType: string = (tx as any)?.extended_entry_type || ""
  const subjectLooksInit = /initial|fund|funding|balance|top\s*up|add\s*funds|opening/i.test(subject)
  const codeLooksInit = /(INIT|FUND|BAL|ADJUST|TOPUP)/i.test(eventCode) || /^T0\d+/.test(eventCode)
  const extendedLooksInit = /INITIAL|FUND|BALANCE|ADJUST/i.test(extendedType)
  if (subjectLooksInit || codeLooksInit || extendedLooksInit) return true
  const amountValue = parseFloat(tx?.transaction_amount?.value || "0")
  if (!subject && amountValue === 0) return true
  return false
}

function isOutgoing(detail: any): boolean {
  const tx = detail?.transaction_info || {}
  const dc = (tx?.transaction_debit_or_credit || "").toUpperCase()
  const valueStr = tx?.transaction_amount?.value || ""
  return dc === "D" || /^-/.test(valueStr)
}

function isIncoming(detail: any): boolean {
  const tx = detail?.transaction_info || {}
  const dc = (tx?.transaction_debit_or_credit || "").toUpperCase()
  const valueStr = tx?.transaction_amount?.value || ""
  return dc === "C" || (!/^-/.test(valueStr) && !!valueStr)
}

function getSignedAmount(tx: any): { signedText: string } {
  const valueStr: string = tx?.transaction_amount?.value || "0"
  const dc: string = (tx?.transaction_debit_or_credit || "").toUpperCase()
  const isDebit = dc === "D" || /^-/.test(valueStr)
  const abs = valueStr.replace(/^-/, "")
  const signedText = isDebit ? (valueStr.startsWith("-") ? valueStr : `-${abs}`) : abs
  return { signedText }
}

export function OrdersOverlay({ open, onOpenChange }: OrdersOverlayProps) {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [fallbackOrder, setFallbackOrder] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filterMode, setFilterMode] = useState<'outgoing' | 'incoming' | 'all'>("outgoing")

  const mapDetailToCard = (t: any, incoming = false) => {
    const tx = t?.transaction_info || {}
    const cart = t?.cart_info || {}
    const items = Array.isArray(cart?.item_details)
      ? cart.item_details.map((it: any) => ({
          name: it?.item_name || "—",
          quantity: it?.item_quantity || 1,
        }))
      : []
    const { signedText } = getSignedAmount(tx)
    return {
      id: tx?.transaction_id || "—",
      date: tx?.transaction_initiation_date || tx?.transaction_updated_date,
      status: tx?.transaction_status || "—",
      amount: signedText,
      currency: tx?.transaction_amount?.currency_code || "USD",
      items,
      incoming,
    }
  }

  const mapOrderApiToCard = (data: any) => {
    const id = data?.id || "—"
    const date = data?.create_time || data?.update_time
    const status = data?.status || "—"
    const pu = Array.isArray(data?.purchase_units) ? data.purchase_units : []
    const first = pu[0] || {}
    const amount = first?.amount?.value || "0"
    const currency = first?.amount?.currency_code || "USD"
    let items: any[] = []
    pu.forEach((u: any) => {
      if (Array.isArray(u?.items)) {
        items = items.concat(
          u.items.map((it: any) => ({
            name: it?.name || "—",
            quantity: it?.quantity || 1,
          }))
        )
      }
    })
    return { id, date, status, amount, currency, items, incoming: false }
  }

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      setFallbackOrder(null)
      const res = await fetch(`/api/paypal/transactions?days=30`, { cache: "no-store" })
      const json = await res.json()
      if (!json?.ok) throw new Error(json?.error || "查询失败")
      const details: any[] = json?.data?.transaction_details || []
      const outgoing = details.filter((d) => isOutgoing(d) && !isNonPurchase(d))
      const incoming = details.filter((d) => isIncoming(d) && !isNonPurchase(d))
      let pool: any[] = []
      if (filterMode === 'outgoing') pool = outgoing.map((t) => mapDetailToCard(t, false))
      else if (filterMode === 'incoming') pool = incoming.map((t) => mapDetailToCard(t, true))
      else pool = [...outgoing.map((t) => mapDetailToCard(t, false)), ...incoming.map((t) => mapDetailToCard(t, true))]
      // 统一按日期倒序
      pool.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      setOrders(pool)
      if (pool.length === 0) {
        // 会话回退：用 get_order 查询最近一次付款成功的订单
        const sid = getLastPaidOrderId()
        if (sid) {
          try {
            const od = await fetch(`/api/paypal/orders/${sid}`, { cache: "no-store" })
            const oj = await od.json()
            if (oj?.ok && oj?.data) {
              setFallbackOrder(mapOrderApiToCard(oj.data))
              return
            }
          } catch {}
        }
        if (json?.fallback?.lastSubmitted) {
          const fb = mapDetailToCard(json.fallback.lastSubmitted, isIncoming(json.fallback.lastSubmitted))
          setFallbackOrder(fb)
        }
      }
    } catch (e: any) {
      setError(e?.message || "查询失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      load()
    }
  }, [open, filterMode])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div className="relative w-[360px] max-w-[92vw] h-[640px] max-h-[86vh] text-white rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.45)] overflow-hidden border border-white/15 bg-gradient-to-br from-white/10 to-white/[0.06] flex flex-col">
        {/* 顶部加载进度条 */}
        {loading && (
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 animate-pulse" />
        )}
        {/* 顶部栏 */}
        <div className="flex items-center justify-between px-4 py-3 bg-white/10 border-b border-white/10">
          <div className="font-semibold tracking-wide">最近订单（30天）</div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-1">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                  刷新中
                </span>
              ) : (
                "刷新"
              )}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onOpenChange(false)}>关闭</Button>
          </div>
        </div>
        {/* 筛选分段控件 */}
        <div className="px-4 py-2 bg-white/5 border-b border-white/10">
          <div className="grid grid-cols-3 gap-2 text-[12px]">
            <button className={`px-2 py-1 rounded ${filterMode==='outgoing'?'bg-white/20':'bg-white/10 hover:bg-white/15'}`} onClick={()=>setFilterMode('outgoing')}>支出</button>
            <button className={`px-2 py-1 rounded ${filterMode==='incoming'?'bg-white/20':'bg-white/10 hover:bg-white/15'}`} onClick={()=>setFilterMode('incoming')}>入账</button>
            <button className={`px-2 py-1 rounded ${filterMode==='all'?'bg-white/20':'bg-white/10 hover:bg-white/15'}`} onClick={()=>setFilterMode('all')}>全部</button>
          </div>
        </div>
        {/* 列表 */}
        <ScrollArea className="flex-1 px-4 py-3">
          {error && (
            <div className="text-yellow-200 text-sm mb-3">{error}</div>
          )}

          {orders.length === 0 && !loading && !fallbackOrder && (
            <div className="text-sm text-white/80">最近没有支出类的订单记录。</div>
          )}

          {fallbackOrder && (
            <div className="border border-white/20 bg-white/5 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[12px] opacity-80">#{fallbackOrder.id}</div>
                <div className="text-[12px] opacity-80">{formatDate(fallbackOrder.date)}</div>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <div className="text-[12px] opacity-80">状态 {fallbackOrder.status}</div>
                <div className="text-[14px] font-semibold">{fallbackOrder.amount} {fallbackOrder.currency}</div>
              </div>
              <div className="mt-1 text-[12px] opacity-90">
                {Array.isArray(fallbackOrder.items) && fallbackOrder.items.length > 0 ? (
                  fallbackOrder.items.slice(0, 3).map((it: any, idx: number) => (
                    <span key={idx} className="mr-3">{it.name}×{it.quantity}</span>
                  ))
                ) : (
                  <span>—</span>
                )}
              </div>
            </div>
          )}

          {orders.length > 0 && (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="border border-white/20 bg-white/5 hover:bg-white/10 transition-colors rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-[12px] opacity-80">#{o.id}</div>
                    <div className="text-[12px] opacity-80">{formatDate(o.date)}</div>
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="text-[12px] opacity-80 flex items-center gap-2">
                      <span>状态 {o.status}</span>
                      {o.incoming && <Badge variant="secondary">入账</Badge>}
                    </div>
                    <div className="text-[14px] font-semibold">{o.amount} {o.currency}</div>
                  </div>
                  <div className="mt-1 text-[12px] opacity-90">
                    {Array.isArray(o.items) && o.items.length > 0 ? (
                      o.items.slice(0, 3).map((it: any, idx: number) => (
                        <span key={idx} className="mr-3">{it.name}×{it.quantity}</span>
                      ))
                    ) : (
                      <span>—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
