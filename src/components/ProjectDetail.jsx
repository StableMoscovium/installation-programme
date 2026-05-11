import { useState } from 'react'
import { PREP_STAGES, EQ_MAP, MON_NAMES, DAY_NAMES, parseDate, getProjectMilestones, defaultMilestonesList } from '../lib/constants'

export default function ProjectDetail({ project, onBack, onEdit, onDelete, onUpdatePrep, onUpdateMilestone, onUpdateMilestonesList, onUpdateHold }) {
  const [newMilestone, setNewMilestone] = useState('')
  const mobs = Object.entries(project.mobs || {})

  function handlePrepToggle(mobKey, currentPrep, stageIndex) {
    const newPrep = currentPrep > stageIndex ? stageIndex : stageIndex + 1
    onUpdatePrep(mobKey, newPrep)
  }

  return (
    <div className="detail-page">
      <button className="back-btn" onClick={onBack}>‹ Programme</button>

      <div className="detail-header">
        <div className="detail-header-left">
          <div className="detail-proj-num" style={{ color: project.colour?.num }}>
            {project.projNum}
          </div>
          <h2 className="detail-proj-name">{project.projName}</h2>
          {project.address && (
            <p className="detail-sub">📍 {project.address}{project.region ? ` · ${project.region}` : ''}</p>
          )}
          {project.craneType && (
            <p className="detail-sub">{project.craneType}</p>
          )}
        </div>
        <div className="detail-header-actions">
          <button
            className={`btn ${project.onHold ? 'btn-hold-active' : 'btn-hold'}`}
            onClick={() => onUpdateHold(!project.onHold)}
          >
            {project.onHold ? '▶ Resume project' : '⏸ Put on hold'}
          </button>
          <button className="btn btn-ghost" onClick={onEdit}>Edit project</button>
          <button className="btn btn-danger" onClick={() => {
            if (window.confirm(`Delete project ${project.projNum} ${project.projName}?`)) onDelete()
          }}>Delete</button>
        </div>
      </div>

      {/* METRICS */}
      <div className="detail-metrics">
        <div className="metric-card">
          <div className="metric-val">{mobs.length}</div>
          <div className="metric-lbl">Mobilisations</div>
        </div>
        <div className="metric-card">
          <div className="metric-val">{mobs.filter(([, m]) => (m.prep || 0) >= 5).length}/{mobs.length}</div>
          <div className="metric-lbl">Mobs fully prepped</div>
        </div>
        <div className="metric-card">
          <div className="metric-val">{project.client || '—'}</div>
          <div className="metric-lbl">Client</div>
        </div>
        <div className="metric-card">
          <div className="metric-val">{project.region || '—'}</div>
          <div className="metric-lbl">Region</div>
        </div>
      </div>

      {/* CONTACTS — full width, horizontal grid */}
      <div className="detail-card" style={{ marginBottom: 12 }}>
        <h3 className="detail-card-title">Contacts</h3>
        <div className="detail-contacts-grid">
          {(project.contacts || []).filter(c => c.name || c.role).map((c, i) => (
            <div key={i} className="contact-detail-row" style={{ borderBottom: 'none', padding: '6px 0' }}>
              <div className="contact-avatar" style={{ background: project.colour?.bg, color: project.colour?.num }}>
                {(c.name || c.role || '?')[0].toUpperCase()}
              </div>
              <div className="contact-detail-info">
                <div className="contact-detail-name">{c.name || '—'}</div>
                <div className="contact-detail-role">{c.role}</div>
              </div>
              <div className="contact-detail-actions">
                {c.phone && <a href={`tel:${c.phone}`} className="contact-action-btn">📞</a>}
                {c.email && <a href={`mailto:${c.email}`} className="contact-action-btn">✉️</a>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIFECYCLE MILESTONES */}
      <div className="detail-card" style={{ marginBottom: 12 }}>
        <div className="lifecycle-header">
          <h3 className="detail-card-title" style={{ marginBottom: 0 }}>Project Lifecycle</h3>
          {project.onHold && <span className="lifecycle-hold-badge">⏸ On Hold</span>}
        </div>

        <div className="lifecycle-list">
          {getProjectMilestones(project).map((m, i, arr) => {
            const isCurrent = !m.done && (i === 0 || arr[i - 1].done)
            return (
              <div
                key={m.key || i}
                className={`lifecycle-row${m.done ? ' complete' : isCurrent ? ' current' : ''}`}
                onClick={() => {
                  const updated = arr.map((item, idx) => {
                    if (m.done) {
                      // Rewinding — mark this and everything after as undone
                      return { ...item, done: idx < i }
                    } else {
                      // Advancing — mark everything up to and including this as done
                      return { ...item, done: idx <= i }
                    }
                  })
                  onUpdateMilestonesList(updated)
                }}
              >
                <div className={`lifecycle-num${m.done ? ' complete' : isCurrent ? ' current' : ''}`}>
                  {m.done ? '✓' : i + 1}
                </div>
                <div className="lifecycle-label">{m.label}</div>
                <div className="lifecycle-action">
                  {m.done    && <span className="lifecycle-tag done">Done</span>}
                  {isCurrent && <span className="lifecycle-tag current">Current — click to complete</span>}
                  {!m.done && !isCurrent && <span className="lifecycle-tag next">→ Skip to here</span>}
                  {m.custom && (
                    <button
                      className="lifecycle-remove"
                      onClick={e => {
                        e.stopPropagation()
                        onUpdateMilestonesList(arr.filter((_, idx) => idx !== i))
                      }}
                      title="Remove milestone"
                    >×</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Add custom milestone */}
        <div className="lifecycle-add-row">
          <input
            className="lifecycle-add-input"
            placeholder="Add custom milestone…"
            value={newMilestone}
            onChange={e => setNewMilestone(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newMilestone.trim()) {
                const current = getProjectMilestones(project)
                onUpdateMilestonesList([
                  ...current,
                  { key: `custom_${Date.now()}`, label: newMilestone.trim(), done: false, custom: true }
                ])
                setNewMilestone('')
              }
            }}
          />
          <button
            className="lifecycle-add-btn"
            disabled={!newMilestone.trim()}
            onClick={() => {
              const current = getProjectMilestones(project)
              onUpdateMilestonesList([
                ...current,
                { key: `custom_${Date.now()}`, label: newMilestone.trim(), done: false, custom: true }
              ])
              setNewMilestone('')
            }}
          >+ Add</button>
        </div>
      </div>

      {/* MOBILISATIONS — each as its own full-width card */}
      {mobs.map(([key, mob], i) => {
        const mobPrep = mob.prep || 0
        return (
          <div key={key} className="detail-card detail-mob-card">
            <div className="detail-mob-split">

              {/* Left — mob info */}
              <div className="detail-mob-left">
                <div className="mob-detail-header">
                  <span className="mob-detail-label">MOB-{i + 1}</span>
                  <span className="mob-detail-phase">{mob.phase}</span>
                  {mob.start && mob.end && (
                    <span className="mob-detail-dates">{formatDateRange(mob.start, mob.end)}</span>
                  )}
                </div>
                {mob.tasks.length > 0 && (
                  <ul className="mob-task-list">
                    {mob.tasks.map(t => (
                      <li key={t} className="mob-task-item">
                        <span className="task-dot">·</span> {t}
                      </li>
                    ))}
                  </ul>
                )}
                {Object.keys(mob.days || {}).length > 0 && (
                  <div className="mob-equip-summary">
                    {Object.entries(mob.days).map(([iso, codes]) => {
                      if (!codes.length) return null
                      const d = parseDate(iso)
                      return (
                        <div key={iso} className="mob-equip-day">
                          <span className="mob-equip-day-label">
                            {DAY_NAMES[d.getDay()]} {d.getDate()} {MON_NAMES[d.getMonth()]}
                          </span>
                          <div className="mob-equip-chips">
                            {codes.map(code => {
                              const e = EQ_MAP[code]
                              return e
                                ? <span key={code} className="eq-chip-sm" style={{ background: e.bg, color: e.col }}>{e.label}</span>
                                : null
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="detail-mob-divider" />

              {/* Right — prep status */}
              <div className="detail-mob-right">
                <div className="prep-stage-list">
                  {PREP_STAGES.map((stage, si) => {
                    const done   = mobPrep > si
                    const active = mobPrep === si
                    return (
                      <div
                        key={stage.key}
                        className={`prep-stage-row${done ? ' done' : active ? ' active' : ''}`}
                        onClick={() => handlePrepToggle(key, mobPrep, si)}
                      >
                        <div className={`prep-stage-num${done ? ' done' : active ? ' active' : ''}`}>{si + 1}</div>
                        <div className={`prep-stage-label${done ? ' done' : ''}`}>{stage.label.replace(/^\d · /, '')}</div>
                        <div className="prep-stage-status">{done ? '✓' : active ? '⏳' : ''}</div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>
          </div>
        )
      })}

      {/* NOTES */}
      {(project.accessNotes || project.hsNotes || project.genNotes || project.scope) && (
        <div className="detail-card" style={{ marginTop: 12 }}>
          <h3 className="detail-card-title">Notes</h3>
          <div className="notes-grid">
            {project.scope && (
              <div className="note-block">
                <div className="note-label">Scope</div>
                <div className="note-body">{project.scope}</div>
              </div>
            )}
            {project.accessNotes && (
              <div className="note-block">
                <div className="note-label">Site access</div>
                <div className="note-body">{project.accessNotes}</div>
              </div>
            )}
            {project.hsNotes && (
              <div className="note-block">
                <div className="note-label">H&S requirements</div>
                <div className="note-body">{project.hsNotes}</div>
              </div>
            )}
            {project.genNotes && (
              <div className="note-block">
                <div className="note-label">General notes</div>
                <div className="note-body">{project.genNotes}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function formatDateRange(start, end) {
  const s = parseDate(start)
  const e = parseDate(end)
  const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  if (s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.getDate()} ${MON[s.getMonth()]} ${s.getFullYear()}`
  }
  return `${s.getDate()} ${MON[s.getMonth()]} – ${e.getDate()} ${MON[e.getMonth()]} ${s.getFullYear()}`
}
