import { useEffect } from 'react'
import { useApp } from './store'
import { Sidebar } from './ui/Sidebar'
import { Dashboard } from './ui/Dashboard'
import { SettingsModal } from './ui/SettingsModal'
import { WizardView } from './ui/wizard/WizardView'
import { ErrorBoundary } from './ui/ErrorBoundary'

export default function App(): JSX.Element {
  const loadProjects = useApp((s) => s.loadProjects)
  const loadLlmInfo = useApp((s) => s.loadLlmInfo)
  const activeProject = useApp((s) => s.activeProject)
  const settingsOpen = useApp((s) => s.settingsOpen)
  const closeSettings = useApp((s) => s.closeSettings)

  useEffect(() => {
    void loadProjects()
    void loadLlmInfo()
  }, [loadProjects, loadLlmInfo])

  return (
    <div className="aurora flex h-full w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {activeProject ? (
          <ErrorBoundary area="Wizard">
            <WizardView project={activeProject} />
          </ErrorBoundary>
        ) : (
          <Dashboard />
        )}
      </main>
      {settingsOpen && <SettingsModal onClose={closeSettings} />}
    </div>
  )
}
