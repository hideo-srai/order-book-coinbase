import clsx from 'clsx'
import { Level } from 'types'
import {
  FACTOR,
  NUMBER_OF_ROWS,
  SOURCE_SYMBOL,
  TARGET_SYMBOL,
} from '../../config'
import { formatNumber, pad } from '../../utils'

type Props = {
  isBuy?: boolean
  orders: Level[]
  decimals: number
  showHeader?: boolean
}

export default function OrderTable({
  isBuy,
  orders,
  decimals,
  showHeader,
}: Props) {
  return (
    <table className="w-full">
      {showHeader && (
        <thead>
          <tr>
            <th className="text-left text-sm text-slate-400 py-2">
              Price({TARGET_SYMBOL})
            </th>
            <th className="text-right text-sm text-slate-400 py-2">
              Amount({SOURCE_SYMBOL})
            </th>
          </tr>
        </thead>
      )}
      <tbody>
        {pad<Level>(
          orders,
          NUMBER_OF_ROWS,
          {
            price: -1,
            qty: 0,
          },
          !isBuy
        ).map((order, index) =>
          order.price > 0 ? (
            <tr key={`order-${index}-order.price`}>
              <td
                className={clsx('w-1/2 text-left', {
                  'text-[rgb(14,203,129)]': isBuy,
                  'text-[rgb(246,70,93)]': !isBuy,
                })}
              >
                {formatNumber({
                  value: order.price,
                  factor: 1 / FACTOR,
                  decimals: decimals,
                })}
              </td>
              <td className="w-1/2 text-right">
                {formatNumber({
                  value: order.qty,
                  factor: 1 / FACTOR,
                  decimals: 8,
                })}
              </td>
            </tr>
          ) : (
            <tr key={`order-${index}`}>
              <td className="text-left">------</td>
              <td className="text-right">--------</td>
            </tr>
          )
        )}
      </tbody>
    </table>
  )
}
