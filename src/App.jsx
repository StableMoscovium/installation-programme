import { useState, useEffect } from 'react'
import ProgrammeCalendar from './components/ProgrammeCalendar'
import ProjectForm from './components/ProjectForm'
import ProjectDetail from './components/ProjectDetail'
import PrepSummary from './components/PrepSummary'
import { supabase, toDb, fromDb } from './lib/supabase'

export default function App() {
  const [activeTab, setActiveTab] = useState('calendar')
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [editingProject, setEditingProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) {
        setError('Failed to load projects')
        console.error(error)
      } else {
        setProjects(data.map(fromDb))
      }
      setLoading(false)
    }
    loadProjects()
  }, [])

  async function saveProject(project) {
    const { error } = await supabase
      .from('projects')
      .upsert(toDb(project), { onConflict: 'proj_num' })

    if (error) {
      console.error('Save failed:', error)
      return
    }

    setProjects(prev => {
      const idx = prev.findIndex(p => p.projNum === project.projNum)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = project
        return updated
      }
      return [...prev, project]
    })
    setActiveTab('calendar')
    setEditingProject(null)
  }

  async function deleteProject(projNum) {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('proj_num', projNum)

    if (error) {
      console.error('Delete failed:', error)
      return
    }

    setProjects(prev => prev.filter(p => p.projNum !== projNum))
    setSelectedProject(null)
    setActiveTab('calendar')
  }

  async function updatePrep(projNum, mobKey, prep) {
    const project = projects.find(p => p.projNum === projNum)
    if (!project) return

    const updatedMobs = {
      ...project.mobs,
      [mobKey]: { ...project.mobs[mobKey], prep },
    }

    const { error } = await supabase
      .from('projects')
      .update({ mobs: updatedMobs, updated_at: new Date().toISOString() })
      .eq('proj_num', projNum)

    if (error) {
      console.error('Prep update failed:', error)
      return
    }

    setProjects(prev => prev.map(p =>
      p.projNum === projNum ? { ...p, mobs: updatedMobs } : p
    ))
    setSelectedProject(prev => prev ? { ...prev, mobs: updatedMobs } : null)
  }

  function openProject(proj) {
    setSelectedProject(proj)
    setActiveTab('detail')
  }

  function editProject(proj) {
    setEditingProject(proj)
    setActiveTab('input')
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-left">
          <div className="logo-mark">IP</div>
          <div>
            <h1 className="app-title">Installation Programme</h1>
            <p className="app-subtitle">Crane & lifting equipment — programme overview</p>
          </div>
        </div>
        <nav className="app-nav">
          <button
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => { setActiveTab('calendar'); setSelectedProject(null) }}
          >
            <CalendarIcon /> Programme
          </button>
          <button
            className={`nav-item ${activeTab === 'input' ? 'active' : ''}`}
            onClick={() => { setActiveTab('input'); setEditingProject(null) }}
          >
            <PlusIcon /> Add project
          </button>
          <button
            className={`nav-item ${activeTab === 'report' ? 'active' : ''}`}
            onClick={() => setActiveTab('report')}
          >
            <ReportIcon /> Prep report
          </button>
        </nav>
      </header>

      <main className="app-main">
        {loading && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
            Loading projects…
          </div>
        )}
        {error && (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#c00' }}>
            {error}
          </div>
        )}
        {!loading && !error && activeTab === 'calendar' && (
          <ProgrammeCalendar
            projects={projects}
            onOpenProject={openProject}
          />
        )}
        {!loading && activeTab === 'input' && (
          <ProjectForm
            initialData={editingProject}
            onSave={saveProject}
            onCancel={() => { setActiveTab('calendar'); setEditingProject(null) }}
          />
        )}
        {!loading && activeTab === 'detail' && selectedProject && (
          <ProjectDetail
            project={selectedProject}
            onBack={() => { setActiveTab('calendar'); setSelectedProject(null) }}
            onEdit={() => editProject(selectedProject)}
            onDelete={() => deleteProject(selectedProject.projNum)}
            onUpdatePrep={(mobKey, prep) => updatePrep(selectedProject.projNum, mobKey, prep)}
          />
        )}
        {!loading && activeTab === 'report' && (
          <PrepSummary projects={projects} />
        )}
      </main>
    </div>
  )
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}
function ReportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  )
}
