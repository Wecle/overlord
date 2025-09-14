let lastPaidOrderId: string | null = null

export function setLastPaidOrderId(id: string | null) {
  lastPaidOrderId = id
}

export function getLastPaidOrderId(): string | null {
  return lastPaidOrderId
}
