export const SOCKET_URL = 'wss://ws-feed.exchange.coinbase.com' // Web socket url from which messages arrive
export const SOURCE_SYMBOL = 'ETH'
export const TARGET_SYMBOL = 'EUR'
export const PRODUCT = `${SOURCE_SYMBOL}-${TARGET_SYMBOL}`
export const GET_ORDER_BOOK_REST_ENDPOINT = `https://api.exchange.coinbase.com/products/${PRODUCT}/book?level=3`
export const SUBSCRIBE = {
  type: 'subscribe',
  product_ids: [PRODUCT],
  channels: ['full'],
} // Subscribe message to send to coinbase websocket server
export const UNSUBSCRIBE = {
  type: 'unsubscribe',
  channels: ['full'],
} // Unsubscribe message to send to coinbase websocket server

export const MAX_NUMBER_OF_LEVELS = 10000 // Maximum number of levels to be stored in the order book
export const NUMBER_OF_ROWS = 16 // Number of orders to be shown in the table
export const GROUPING = [0, 0.1, 0.5, 1]
export const DECIMALS = [2, 1, 1, 0]
export const FACTOR = 1e8
