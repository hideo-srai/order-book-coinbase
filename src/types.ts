// Types used in OrderBook
export type Level = {
  price: number
  qty: number
}

export type Order = {
  id: string
  qty: number
  price: number
  isBuy: boolean
  level: Level
}

// Types of messages from coinbase websocket feed
export type OpenMessage = {
  type: 'open'
  time: string
  product_id: string
  sequence: number
  order_id: string
  price: string
  remaining_size: string
  side: string
}

export type MatchMessage = {
  type: 'match'
  trade_id: number
  sequence: number
  maker_order_id: string
  taker_order_id: string
  time: string
  product_id: string
  size: string
  price: string
  side: string
}

export type ChangeMessage = {
  type: 'change'
  reason: string
  time: string
  sequence: number
  order_id: string
  side: string
  product_id: string
  old_size: string
  new_size: string
  old_price: string
  new_price: string
}

export type DoneMessage = {
  type: 'done'
  trade_id: number
  sequence: number
  order_id: string
  time: string
  product_id: string
  remaining_size: string
  price: string
  side: string
}

export type Message = OpenMessage | MatchMessage | DoneMessage | ChangeMessage
