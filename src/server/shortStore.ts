const store: Map<string, string> = (global as any).__SHORT_STORE__ || new Map<string, string>()
;(global as any).__SHORT_STORE__ = store

function generateId(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let id = ""
  for (let i = 0; i < length; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

export function putShareData(encoded: string): string {
  let id = generateId()
  // 防止极小概率冲突
  while (store.has(id)) id = generateId()
  store.set(id, encoded)
  return id
}

export function getShareData(id: string): string | null {
  return store.get(id) || null
}


