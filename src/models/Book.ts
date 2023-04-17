import {
  ChangeMessage,
  DoneMessage,
  Level,
  MatchMessage,
  Message,
  OpenMessage,
  Order,
} from 'types'
import { FACTOR, GROUPING, MAX_NUMBER_OF_LEVELS } from '../config'
import { gt, lt, roundToNearest, CompareFunc, adjustNumber } from '../utils'

export class Book {
  orders: Record<string, Order>
  asks: Level[]
  bids: Level[]
  groupedAsks: Level[]
  groupedBids: Level[]
  matchedPrice: number | null
  grouping: number

  constructor() {
    this.orders = {}
    this.asks = []
    this.bids = []
    this.groupedAsks = []
    this.groupedBids = []
    this.matchedPrice = null
    this.grouping = 0
  }

  /**
   * Initialize levels based on orders, each order consists of 3 strings - price, qty, id
   */
  private initLevels(
    orders: [string, string, string][],
    cmp: CompareFunc<number>
  ) {
    const levels: Level[] = []

    orders.forEach((order) => {
      const price = adjustNumber(order[0], FACTOR)
      const qty = adjustNumber(order[1], FACTOR)
      const oid = order[2]
      let level = levels[levels.length - 1]

      if (!level || cmp(level.price, price)) {
        level = {
          price,
          qty,
        }
        levels.push(level)
      } else {
        level.qty += qty
      }

      this.orders[oid] = {
        id: oid,
        price,
        qty,
        isBuy: false,
        level,
      }
    })

    return levels
  }

  /**
   * Finds the position to create or update a level
   */
  private findPosition(
    price: number,
    levels: Level[],
    cmp: CompareFunc<number>
  ) {
    let low = 0
    let high = levels.length

    while (low != high) {
      let mid = (low + high) >>> 1

      if (levels[mid].price === price) return mid

      if (cmp(levels[mid].price, price)) {
        low = mid + 1
      } else {
        high = mid
      }
    }

    return high
  }

  private removeLevel(side: string, level: Level) {
    const levels = side === 'buy' ? this.bids : this.asks
    const idx = levels.indexOf(level)
    if (idx !== -1) levels.splice(idx, 1)
  }

  /**
   * Finds and updates the level. Creates a new one if not found
   */
  private addLevel(
    levels: Level[],
    price: number,
    qty: number,
    cmp: CompareFunc<number>
  ): [string, number] {
    let idx = this.findPosition(price, levels, cmp)
    let result = 'failed'

    if (idx < levels.length && levels[idx].price === price) {
      levels[idx].qty += qty
      result = 'updated'
    } else if (levels.length < MAX_NUMBER_OF_LEVELS) {
      levels.splice(idx, 0, { price, qty })
      result = 'created'
    }

    return [result, idx]
  }

  /**
   * Finds and updates the quantity of a grouped level
   */
  private updateGroupedLevel(price: number, qty: number, side: string) {
    const roundedPrice =
      roundToNearest(price / FACTOR, GROUPING[this.grouping]) * FACTOR
    const levels = side === 'buy' ? this.groupedBids : this.groupedAsks
    const cmp = side === 'buy' ? gt : lt
    const idx = this.findPosition(roundedPrice, levels, cmp)

    if (idx !== levels.length) {
      levels[idx].qty += qty
      if (levels[idx].qty <= 0) levels.splice(idx, 1)
    }
  }

  /**
   * Removes levels that have the price exceeding threshold
   */
  private filterLevels(
    levels: Level[],
    threshold: number,
    cmp: CompareFunc<number>
  ) {
    const index = levels.findIndex((item) => cmp(item.price, threshold))
    return levels.slice(index)
  }

  /**
   * Adds an order and inserts a new level or updates the existing one
   */
  private handleOpen(msg: OpenMessage) {
    const oid = msg.order_id
    const isBuy = msg.side === 'buy'
    const price = adjustNumber(msg.price, FACTOR)
    const qty = adjustNumber(msg.remaining_size, FACTOR)
    const levels = isBuy ? this.bids : this.asks
    const cmp = isBuy ? gt : lt

    const [result, idx] = this.addLevel(levels, price, qty, cmp)

    if (result !== 'failed') {
      this.orders[oid] = {
        id: oid,
        qty,
        price,
        isBuy,
        level: levels[idx],
      }

      if (idx === 0 && result === 'created') {
        if (isBuy) this.asks = this.filterLevels(this.asks, price, cmp)
        else this.bids = this.filterLevels(this.bids, price, cmp)
      }
    }

    if (GROUPING[this.grouping] > 0) {
      const groupedLevels = isBuy ? this.groupedBids : this.groupedAsks
      this.addLevel(
        groupedLevels,
        roundToNearest(price / FACTOR, GROUPING[this.grouping]) * FACTOR,
        qty,
        cmp
      )

      if (result === 'created' && idx === 0) {
        if (isBuy)
          this.groupedAsks = this.filterLevels(this.groupedAsks, price, cmp)
        else this.groupedBids = this.filterLevels(this.groupedBids, price, cmp)
      }
    }
  }

  /**
   * Reduces the quantity when the order is matched
   */
  private handleMatch(msg: MatchMessage) {
    const oid = msg.maker_order_id
    const size = adjustNumber(msg.size, FACTOR)
    const order = this.orders[oid]

    if (order) {
      this.matchedPrice = adjustNumber(msg.price, FACTOR)
      order.qty -= size
      order.level.qty -= size

      if (GROUPING[this.grouping] > 0)
        this.updateGroupedLevel(order.price, -size, msg.side)
      if (order.qty <= 0) delete this.orders[oid]
      if (order.level.qty <= 0) this.removeLevel(msg.side, order.level)
    }
  }

  /**
   * Reduces the quantity when the order is done
   */
  private handleDone(msg: DoneMessage) {
    const oid = msg.order_id
    const size = adjustNumber(msg.remaining_size, FACTOR)
    const order = this.orders[oid]

    if (order) {
      order.qty -= size
      order.level.qty -= size

      if (GROUPING[this.grouping] > 0)
        this.updateGroupedLevel(order.price, -size, msg.side)

      if (order.qty <= 0) delete this.orders[oid]
      if (order.level.qty <= 0) this.removeLevel(msg.side, order.level)
    }
  }

  /**
   * Updates orders and levels when an order is modified
   */
  private handleChange(msg: ChangeMessage) {
    if (msg.reason !== 'modify_order') return

    const oid = msg.order_id
    const order = this.orders[oid]

    if (order) {
      const oldSize = adjustNumber(msg.old_size, FACTOR)
      const newSize = adjustNumber(msg.new_size, FACTOR)
      const newPrice = adjustNumber(msg.new_price, FACTOR)
      const isBuy = msg.side === 'buy'
      const levels = isBuy ? this.bids : this.asks
      const cmp = isBuy ? gt : lt

      order.level.qty -= oldSize
      order.price = newPrice
      order.qty = newSize

      if (order.level.qty <= 0) this.removeLevel(msg.side, order.level)

      this.addLevel(levels, newPrice, newSize, cmp)
    }
  }

  private groupLevels(levels: Level[], cmp: CompareFunc<number>) {
    const result: Level[] = []

    levels.forEach((level) => {
      this.addLevel(
        result,
        roundToNearest(level.price / FACTOR, GROUPING[this.grouping]) * FACTOR,
        level.qty,
        cmp
      )
    })

    return result
  }

  /**
   * Initialize the book based on ask and bid orders, each order consists of 3 strings - price, qty, id
   */
  init(asks: [string, string, string][], bids: [string, string, string][]) {
    this.groupedAsks = []
    this.groupedBids = []
    this.matchedPrice = null
    this.grouping = 0
    this.asks = this.initLevels(asks, lt)
    this.bids = this.initLevels(bids, gt)
  }

  /**
   * Handles different types of messages based on "type" property
   */
  handleUpdate(msg: Message) {
    switch (msg.type) {
      case 'open':
        this.handleOpen(msg)
        break
      case 'match':
        this.handleMatch(msg)
        break
      case 'done':
        this.handleDone(msg)
        break
      case 'change':
        this.handleChange(msg)
        break
      default:
    }
  }

  updateGrouping(value: number) {
    this.grouping = value

    if (GROUPING[this.grouping] > 0) {
      this.groupedAsks = this.groupLevels(this.asks, lt)
      this.groupedBids = this.groupLevels(this.bids, gt)
    }
  }

  getGroupedAsks() {
    return GROUPING[this.grouping] > 0 ? this.groupedAsks : this.asks
  }

  getGroupedBids() {
    return GROUPING[this.grouping] > 0 ? this.groupedBids : this.bids
  }
}
