import type { ReactNode } from 'react'
import { GateChatPanel, type GateChatPanelProps } from './GateChatPanel'

interface GateWorkbenchProps extends GateChatPanelProps {
  rightPanel?: ReactNode
}

/** Bọc chung: chat trái (~40%) · output phải (~60%) cuộn riêng. Màn hẹp xếp dọc. */
export function GateWorkbench({ rightPanel, ...chatProps }: GateWorkbenchProps): JSX.Element {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4 h-[calc(100vh-8rem)]">
      <div className="overflow-y-auto min-h-0">
        <GateChatPanel {...chatProps} />
      </div>
      <div className="overflow-y-auto min-h-0 border-l border-ink-800 pl-4">
        {rightPanel}
      </div>
    </div>
  )
}
