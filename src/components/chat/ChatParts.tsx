import React, { useEffect, useRef, useState } from "react"
import { Product } from "@/types/products"
import { ToolInvocationUIPart, TextUIPart, Message } from "@ai-sdk/ui-utils"
import { generateId, UIMessage } from "ai"
import { Response } from "@/components/ai-elements/response"
import { ProductDialog } from "@/components/dialog/ProductDialog"
import { getLastPaidOrderId, setLastPaidOrderId } from "@/utils/paypalSession"

interface ChatPartsProps {
  append: (message: Message) => void
}

function CustomLink({ href, children, ...props }: any) {
  return (
    <a
      href={href}
      className="text-white underline font-medium"
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    >
      {children}
    </a>
  )
}

function formatDate(d?: string) {
  try {
    if (!d) return "—"
    return new Date(d).toLocaleString()
  } catch {
    return d || "—"
  }
}

const NO_ORDER_LINES = [
  "最近没有在我这儿的采购记录呢～要不要看看新到的货？✨",
  "我翻了翻账本，近期还没你的消费条目哦。需要我推荐几样热销的吗？🧭",
  "这阵子你在我这里还没买过东西呀～随时想逛我都在柜台这边等你😄",
  "目前没有找到你的近期订单。如果有想要的类别，跟我说，我给你找找！🛒",
]
function personaNoOrdersMessageFor(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  const idx = NO_ORDER_LINES.length > 0 ? hash % NO_ORDER_LINES.length : 0
  return NO_ORDER_LINES[idx] || NO_ORDER_LINES[0]
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

function getSignedAmount(tx: any): { signedText: string; abs: string } {
  const valueStr: string = tx?.transaction_amount?.value || "0"
  const dc: string = (tx?.transaction_debit_or_credit || "").toUpperCase()
  const isDebit = dc === "D" || /^-/.test(valueStr)
  const abs = valueStr.replace(/^-/, "")
  const signedText = isDebit ? (valueStr.startsWith("-") ? valueStr : `-${abs}`) : abs
  return { signedText, abs }
}

export function useChatParts ({ append }: ChatPartsProps) {
  const [openDetailId, setOpenDetailId] = useState<string | null>(null)
  const detailsCacheRef = useRef<Record<string, any>>({})
  const noOrdersShownRef = useRef<Set<string>>(new Set())
  const handledToolCallIdsRef = useRef<Set<string>>(new Set())
  const prefetchStartedRef = useRef<Set<string>>(new Set())

  const renderToolInvocation = (part: ToolInvocationUIPart) => {
    const { toolName, toolCallId, args } = part.toolInvocation as any
    const result = (part.toolInvocation as any).result

    switch (toolName) {
      case 'show_product_btn':
        return (
          <ProductDialog
            key={toolCallId}
            products={args.products}
            onConfirm={(products: Product[])=> {
              const message = `我想要买${products.map(p => p.name).join('、')}`
              append({ id: generateId(), role: 'user', content: message })
            }}
          />
        )
      case 'list_transactions':
      case 'list_recent_transactions': {
        const ok = result?.ok
        let details = result?.data?.transaction_details as any[] | undefined
        if (!ok) {
          return (
            <div key={toolCallId} className="text-yellow-100 text-sm">
              抱歉，刚刚没有顺利查到最近的订单记录😥。可能是权限或时间范围不匹配，要不要换个时间段再试试？
            </div>
          )
        }
        if (Array.isArray(details)) {
          details = details.filter((d) => isOutgoing(d) && !isNonPurchase(d))
        }
        if (!details || details.length === 0) {
          // 本地回退：使用 get_order 查询最近一次付款成功的订单
          const FallbackOrderCard = ({ cacheKey }: { cacheKey: string }) => {
            const [data, setData] = useState<any | null>(null)
            const [orderId, setOrderId] = useState<string | null>(null)
            useEffect(() => {
              setOrderId(getLastPaidOrderId())
            }, [])
            useEffect(() => {
              if (!orderId) return
              let aborted = false
              fetch(`/api/paypal/orders/${orderId}`, { cache: 'no-store' })
                .then(res => res.json())
                .then(json => { if (!aborted && json?.ok) setData(json.data) })
                .catch(() => {})
              return () => { aborted = true }
            }, [orderId])
            if (!orderId) return null
            if (!data) return (
              <div className="text-yellow-100 text-sm">正在获取你刚刚的付款订单...</div>
            )
            // 写入缓存（内存），供“查看详情”直接展开
            if (data?.id) {
              detailsCacheRef.current[data.id] = data
            }
            const id = data?.id || '—'
            const date = data?.create_time || data?.update_time
            const status = data?.status || '—'
            const pu = Array.isArray(data?.purchase_units) ? data.purchase_units : []
            const first = pu[0] || {}
            const amount = first?.amount?.value || '0'
            const currency = first?.amount?.currency_code || 'USD'
            let items: any[] = []
            pu.forEach((u: any) => {
              if (Array.isArray(u?.items)) {
                items = items.concat(u.items.map((it: any) => ({
                  name: it?.name || '—',
                  quantity: it?.quantity || 1,
                  unit_amount: it?.unit_amount?.value || '—',
                  currency: it?.unit_amount?.currency_code || currency,
                })))
              }
            })
            return (
              <div className="border border-white/20 bg-white/5 rounded-md p-3 text-white">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs opacity-80">订单号 #{id}</div>
                  <div className="text-xs opacity-80">{formatDate(date)}</div>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="text-xs opacity-80">状态 {status}</div>
                  <div className="text-sm font-semibold">{amount} {currency}</div>
                </div>
                <div className="mt-1 text-xs opacity-90">
                  {items.length > 0 ? items.slice(0, 3).map((it: any, idx: number) => (
                    <span key={idx} className="mr-3">{it.name}×{it.quantity}</span>
                  )) : '—'}
                </div>
                <div className="mt-2">
                  <button
                    className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                    onClick={() => {
                      setOpenDetailId(openDetailId === id ? null : id)
                      setTimeout(() => { window.dispatchEvent(new Event('chat:scroll-bottom')) }, 0)
                    }}
                  >
                    查看订单详情
                  </button>
                </div>
                {openDetailId === id && detailsCacheRef.current[id] && (
                  (() => {
                    const data = detailsCacheRef.current[id]
                    const id2 = data?.id || '—'
                    const status2 = data?.status || '—'
                    const payerName = data?.payer?.name?.given_name && data?.payer?.name?.surname
                      ? `${data.payer.name.given_name} ${data.payer.name.surname}`
                      : (data?.payer?.email_address || '—')
                    const pu = Array.isArray(data?.purchase_units) ? data.purchase_units : []
                    const first = pu[0] || {}
                    const amount2 = first?.amount?.value || '0'
                    const currency2 = first?.amount?.currency_code || 'USD'
                    let items2: any[] = []
                    pu.forEach((u: any) => {
                      if (Array.isArray(u?.items)) {
                        items2 = items2.concat(u.items.map((it: any) => ({
                          name: it?.name || '—',
                          quantity: it?.quantity || 1,
                          unit_amount: it?.unit_amount?.value || '—',
                          currency: it?.unit_amount?.currency_code || currency2,
                        })))
                      }
                    })
                    const date2 = data?.create_time || data?.update_time
                    return (
                      <div className="mt-2 text-xs bg-black/30 p-2 rounded">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div className="opacity-80">订单号</div><div className="font-mono">{id2}</div>
                          <div className="opacity-80">日期</div><div>{formatDate(date2)}</div>
                          <div className="opacity-80">状态</div><div>{status2}</div>
                          <div className="opacity-80">付款方</div><div>{payerName}</div>
                          <div className="opacity-80">合计</div><div>{amount2} {currency2}</div>
                        </div>
                        <div className="mt-2 opacity-90">商品</div>
                        <div className="mt-1 space-y-1">
                          {items2.length > 0 ? (
                            items2.map((it: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between">
                                <div className="truncate mr-2">{it.name} × {it.quantity}</div>
                                <div className="opacity-80">{it.unit_amount} {it.currency}</div>
                              </div>
                            ))
                          ) : (
                            <div className="opacity-70">—</div>
                          )}
                        </div>
                      </div>
                    )
                  })()
                )}
              </div>
            )
          }
          // 避免多次渲染重复
          if (noOrdersShownRef.current.has(toolCallId)) return null
          noOrdersShownRef.current.add(toolCallId)
          return <FallbackOrderCard cacheKey={toolCallId} />
        }
        // 正常渲染分支：有交易明细
        const orders = details.map((t: any) => {
          const tx = t?.transaction_info || {}
          const cart = t?.cart_info || {}
          const payer = t?.payer_info || {}
          const items = Array.isArray(cart?.item_details)
            ? cart.item_details.map((it: any) => ({
                name: it?.item_name || '—',
                quantity: it?.item_quantity || 1,
                unit_amount: it?.item_unit_price?.value || it?.item_amount?.value || undefined,
                currency: it?.item_unit_price?.currency_code || it?.item_amount?.currency_code || tx?.transaction_amount?.currency_code || 'USD',
              }))
            : []
          const date = tx?.transaction_initiation_date || tx?.transaction_updated_date
          const { signedText } = getSignedAmount(tx)
          return {
            id: tx.transaction_id || '—',
            totalSigned: signedText,
            currency: tx.transaction_amount?.currency_code || 'USD',
            date,
            status: tx.transaction_status || '—',
            payer: payer?.payer_name?.alternate_full_name || payer?.email_address || '—',
            items,
          }
        })
        // 静默预取前N条订单详情（每个 toolCallId 只执行一次）
        const PREFETCH_LIMIT = 3
        if (!prefetchStartedRef.current.has(toolCallId)) {
          prefetchStartedRef.current.add(toolCallId)
          ;(async () => {
            try {
              const targets = orders.slice(0, PREFETCH_LIMIT)
              for (const o of targets) {
                if (!o.id || detailsCacheRef.current[o.id]) continue
                fetch(`/api/paypal/orders/${o.id}`, { cache: 'no-store' })
                  .then(res => res.json())
                  .then(json => {
                    if (json?.ok && json?.data?.id) {
                      detailsCacheRef.current[json.data.id] = json.data
                    }
                  })
                  .catch(() => {})
              }
            } catch {}
          })()
        }
        return (
          <div key={toolCallId} className="space-y-2">
            {orders.map((o: any) => (
              <div key={o.id} className="border border-white/20 bg-white/5 rounded-md p-3 text-white">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-xs opacity-80">订单号 #{o.id}</div>
                  <div className="text-xs opacity-80">{formatDate(o.date)}</div>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <div className="text-xs opacity-80">状态 {o.status}</div>
                  <div className="text-sm font-semibold">{o.totalSigned} {o.currency}</div>
                </div>
                <div className="mt-1 text-xs opacity-90">
                  {Array.isArray(o.items) && o.items.length > 0
                    ? o.items.slice(0, 3).map((it: any, idx: number) => (
                        <span key={idx} className="mr-3">
                          {it.name}×{it.quantity}
                        </span>
                      ))
                    : '—'}
                </div>
                <div className="mt-2">
                  <button
                    className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20"
                    onClick={() => {
                      // 若已缓存详情则仅切换显隐；否则追加消息触发获取
                      if (detailsCacheRef.current[o.id]) {
                        setOpenDetailId(openDetailId === o.id ? null : o.id)
                        setTimeout(() => { window.dispatchEvent(new Event('chat:scroll-bottom')) }, 0)
                      } else {
                        append({ id: generateId(), role: 'user', content: `查询订单详情 ${o.id}` })
                        setTimeout(() => { window.dispatchEvent(new Event('chat:scroll-bottom')) }, 0)
                      }
                    }}
                  >
                    查看订单详情
                  </button>
                </div>
                {openDetailId === o.id && detailsCacheRef.current[o.id] && (
                  (() => {
                    const data = detailsCacheRef.current[o.id]
                    const id = data?.id || '—'
                    const status = data?.status || '—'
                    const payerName = data?.payer?.name?.given_name && data?.payer?.name?.surname
                      ? `${data.payer.name.given_name} ${data.payer.name.surname}`
                      : (data?.payer?.email_address || '—')
                    const pu = Array.isArray(data?.purchase_units) ? data.purchase_units : []
                    const first = pu[0] || {}
                    const amount = first?.amount?.value || '0'
                    const currency = first?.amount?.currency_code || 'USD'
                    let items: any[] = []
                    pu.forEach((u: any) => {
                      if (Array.isArray(u?.items)) {
                        items = items.concat(u.items.map((it: any) => ({
                          name: it?.name || '—',
                          quantity: it?.quantity || 1,
                          unit_amount: it?.unit_amount?.value || '—',
                          currency: it?.unit_amount?.currency_code || currency,
                        })))
                      }
                    })
                    const date = data?.create_time || data?.update_time
                    return (
                      <div className="mt-2 text-xs bg-black/30 p-2 rounded">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <div className="opacity-80">订单号</div><div className="font-mono">{id}</div>
                          <div className="opacity-80">日期</div><div>{formatDate(date)}</div>
                          <div className="opacity-80">状态</div><div>{status}</div>
                          <div className="opacity-80">付款方</div><div>{payerName}</div>
                          <div className="opacity-80">合计</div><div>{amount} {currency}</div>
                        </div>
                        <div className="mt-2 opacity-90">商品</div>
                        <div className="mt-1 space-y-1">
                          {items.length > 0 ? (
                            items.map((it: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between">
                                <div className="truncate mr-2">{it.name} × {it.quantity}</div>
                                <div className="opacity-80">{it.unit_amount} {it.currency}</div>
                              </div>
                            ))
                          ) : (
                            <div className="opacity-70">—</div>
                          )}
                        </div>
                      </div>
                    )
                  })()
                )}
              </div>
            ))}
          </div>
        )
      }
      case 'get_order_details':
      case 'get_order': {
        if (handledToolCallIdsRef.current.has(toolCallId)) return null
        const ok = result?.ok
        const data = result?.data
        if (!ok || !data) {
          return (
            <div key={toolCallId} className="text-yellow-100 text-sm">
              抱歉，这笔订单的详细信息暂时没拿到📦。可能是订单号不可用或权限限制，我可以再帮你换一笔试试～
            </div>
          )
        }
        // 缓存详情，不直接展示，由卡片按钮控制显隐
        const id = data?.id
        if (id) {
          detailsCacheRef.current[id] = data
          setLastPaidOrderId(id)
        }
        handledToolCallIdsRef.current.add(toolCallId)
        return null
      }
      default:
        return null
    }
  }

  const renderText = (message: UIMessage, part: TextUIPart, index: number) => (
    <Response key={`${message.id}-${index}`} className="leading-relaxed" components={{ a: CustomLink }}>
      {part.text}
    </Response>
  )

  const renderPart = (message: UIMessage) => (
    <>
      {message.parts.map((part, i) => {
        switch (part.type) {
          case 'text':
            return renderText(message, part, i)
          case 'tool-invocation':
            return renderToolInvocation(part)
        }
      })}
    </>
  )

  return { renderText, renderToolInvocation, renderPart }
}
