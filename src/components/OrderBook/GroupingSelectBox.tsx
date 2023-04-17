import { GROUPING } from '../../config'

type Props = {
  grouping: number
  onChangeGrouping: (newGrouping: number) => void
}

export default function GroupingSelectBox({
  grouping,
  onChangeGrouping,
}: Props) {
  const groupingValue = GROUPING[grouping] || 'None'

  const handleDecreaseGrouping = () => {
    if (grouping > 0) onChangeGrouping(grouping - 1)
  }

  const handleIncreaseGrouping = () => {
    if (grouping < GROUPING.length - 1) onChangeGrouping(grouping + 1)
  }

  return (
    <div className="flex justify-between items-center p-2 border border-gray-500">
      <div className="text-sm">Grouping: {groupingValue}</div>
      <div className="flex gap-1">
        <button
          className="bg-slate-700 hover:bg-slate-600 px-4 py-2 disabled:bg-zinc-900"
          disabled={grouping === 0}
          onClick={handleDecreaseGrouping}
        >
          -
        </button>
        <button
          className="bg-slate-700 hover:bg-slate-600 px-4 py-2 disabled:bg-zinc-900"
          disabled={grouping === GROUPING.length - 1}
          onClick={handleIncreaseGrouping}
        >
          +
        </button>
      </div>
    </div>
  )
}
