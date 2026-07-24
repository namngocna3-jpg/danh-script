import { GateWorkbench } from './GateWorkbench'
import { StageOutputView } from './StageOutputView'
import { InheritedDataView } from './InheritedDataView'

export function StoryboardPanel({ projectId, onDone }: { projectId: number; onDone: () => void }): JSX.Element {
  return (
    <GateWorkbench
      projectId={projectId}
      stage="gate_storyboard"
      gateId="storyboard"
      title="🎞️ Phân cảnh"
      desc="Chia mỗi cảnh thành shot chi tiết (cỡ cảnh/góc/camera/Start→End/@tag) để bước ảnh/video bám theo."
      onDone={onDone}
      rightPanel={
        <>
          <StageOutputView stage="gate_storyboard" />
          <InheritedDataView stage="gate_storyboard" />
        </>
      }
    />
  )
}
