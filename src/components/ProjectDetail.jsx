import { PREP_STAGES, EQ_MAP, MON_NAMES, DAY_NAMES, parseDate } from '../lib/constants'

export default function ProjectDetail({ project, onBack, onEdit, onDelete, onUpdatePrep }) {
  const mobs = Object.entries(project.mobs || {})

  function handlePrepToggle(stageIndex) {
    const newPrep = project.prep > stageIndex ? stageIndex : stageIndex + 1
    onUpdatePrep(project.projNum, newPrep)
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
          <div className="metric-val">{project.prep || 0}/5</div>
          <div className="metric-lbl">Prep complete</div>
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

      <div className="detail-two-col">
        {/* MOBILISATIONS */}
        <div className="detail-card">
          <h3 className="detail-card-title">Mobilisations</h3>
          {mobs.map(([key, mob], i) => (
            <div key={key} className="mob-detail-block">
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
          ))}
        </div>

        {/* PREP + CONTACTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="detail-card">
            <h3 className="detail-card-title">Prep status</h3>
            <div className="prep-stage-list">
              {PREP_STAGES.map((stage, i) => {
                const done = (project.prep || 0) > i
                const active = (project.prep || 0) === i
                return (
                  <div
                    key={stage.key}
                    className={`prep-stage-row${done ? ' done' : active ? ' active' : ''}`}
                    onClick={() => handlePrepToggle(i)}
                  >
                    <div className={`prep-stage-num${done ? ' done' : active ? ' active' : ''}`}>{i + 1}</div>
                    <div className={`prep-stage-label${done ? ' done' : ''}`}>{stage.label.replace(/^\d · /, '')}</div>
                    <div className="prep-stage-status">
                      {done ? '✓ Done' : active ? '⏳ Pending' : ''}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="detail-card">
            <h3 className="detail-card-title">Contacts</h3>
            {(project.contacts || []).filter(c => c.name || c.role).map((c, i) => (
              <div key={i} className="contact-detail-row">
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
      </div>

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
