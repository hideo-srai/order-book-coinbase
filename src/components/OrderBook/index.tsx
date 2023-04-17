import { useMemo, useState } from 'react'
import GroupingSelectBox from './GroupingSelectBox'
import OrderTable from './OrderTable'
import { Book } from 'models/Book'
import { DECIMALS, FACTOR, NUMBER_OF_ROWS, TARGET_SYMBOL } from '../../config'
import { formatNumber } from '../../utils'

type Props = {
  book: Book
}

export default function OrderBook({ book }: Props) {
  const handleChangeGrouping = (newGrouping: number) => {
    book.updateGrouping(newGrouping)
  }

  return (
    <div className="min-w-[240px] max-w-[280px]">
      <GroupingSelectBox
        grouping={book.grouping}
        onChangeGrouping={handleChangeGrouping}
      />
      <div className="p-2 border border-gray-500">
        <OrderTable
          orders={book.getGroupedAsks().slice(0, NUMBER_OF_ROWS).reverse()}
          decimals={DECIMALS[book.grouping]}
          showHeader
        />
        <div className="h-10 flex justify-center items-center text-xl">
          <span>
            {book.matchedPrice &&
              `${formatNumber({
                value: book.matchedPrice,
                factor: 1 / FACTOR,
              })} ${TARGET_SYMBOL}`}
          </span>
        </div>
        <OrderTable
          isBuy
          orders={book.getGroupedBids().slice(0, NUMBER_OF_ROWS)}
          decimals={DECIMALS[book.grouping]}
        />
      </div>
    </div>
  )
}
