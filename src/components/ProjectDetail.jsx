import { useState } from 'react'
import { PREP_STAGES, EQ_MAP, MON_NAMES, DAY_NAMES, parseDate, getProjectMilestones } from '../lib/constants'

export default function ProjectDetail({ project, onBack, onEdit, onDelete, onUpdatePrep, onUpdateMilestone, onUpdateMilestonesList, onUpdateHold, onUpdateMobNotes, onUpdateKit }) {
  const mobs = Object.entries(project.mobs || {})
  // Track which mob is in edit mode and its draft text
  const [editingNotes, setEditingNotes] = useState({}) // { mobKey: draftText }

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

      {/* KIT TRACKING */}
      <KitCard kit={project.kit} onSave={onUpdateKit} />

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
                  const updated = arr.map((item, idx) => ({
                    ...item,
                    done: m.done ? idx < i : idx <= i,
                  }))
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
                  {!m.done && !isCurrent && <span className="lifecycle-tag next">→ Advance to here</span>}
                </div>
              </div>
            )
          })}
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 10 }}>
          To add or remove milestones, edit the project.
        </p>
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

              {/* Right — prep status + notes */}
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

                {/* Mob notes */}
                <div className="mob-notes-panel">
                  <div className="mob-notes-header">
                    <span className="mob-notes-title">Notes</span>
                    {editingNotes[key] === undefined && (
                      <button
                        className="mob-notes-edit-btn"
                        onClick={() => setEditingNotes(prev => ({ ...prev, [key]: mob.notes || '' }))}
                      >
                        {mob.notes ? 'Edit' : '+ Add'}
                      </button>
                    )}
                  </div>

                  {editingNotes[key] !== undefined ? (
                    <div className="mob-notes-edit">
                      <textarea
                        className="mob-notes-textarea"
                        value={editingNotes[key]}
                        onChange={e => setEditingNotes(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder="Add notes, lessons learned, site observations…"
                        rows={4}
                        autoFocus
                      />
                      <div className="mob-notes-actions">
                        <button
                          className="btn btn-primary"
                          style={{ fontSize: 12, padding: '5px 14px' }}
                          onClick={() => {
                            onUpdateMobNotes(key, editingNotes[key])
                            setEditingNotes(prev => { const n = { ...prev }; delete n[key]; return n })
                          }}
                        >Save</button>
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: 12, padding: '5px 14px' }}
                          onClick={() => setEditingNotes(prev => { const n = { ...prev }; delete n[key]; return n })}
                        >Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`mob-notes-body${!mob.notes ? ' empty' : ''}`}
                      onClick={() => setEditingNotes(prev => ({ ...prev, [key]: mob.notes || '' }))}
                    >
                      {mob.notes || 'No notes yet — click to add'}
                    </div>
                  )}
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

function KitCard({ kit, onSave }) {
  const [editing, setEditing] = useState(false)
  const blank = { supplier: '', cartage: '', kitProduction: '', kitReady: '', sent: '', arrived: '', trackingLink: '' }
  const [draft, setDraft] = useState(kit || blank)

  function set(field, val) { setDraft(prev => ({ ...prev, [field]: val })) }

  function fmtDate(iso) {
    if (!iso) return '—'
    const [y, m, d] = iso.split('-')
    const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${parseInt(d)} ${mon[parseInt(m) - 1]} ${y}`
  }

  function startEdit() { setDraft(kit || blank); setEditing(true) }
  function cancel()    { setDraft(kit || blank); setEditing(false) }
  function save()      { onSave(draft); setEditing(false) }

  const k = kit || blank

  return (
    <div className="detail-card kit-card" style={{ marginBottom: 12 }}>
      <div className="kit-header">
        <h3 className="detail-card-title" style={{ marginBottom: 0 }}>Kit</h3>
        {!editing
          ? <button className="mob-notes-edit-btn" onClick={startEdit}>Edit</button>
          : <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" style={{ fontSize: 12, padding: '4px 14px' }} onClick={save}>Save</button>
              <button className="btn btn-ghost"   style={{ fontSize: 12, padding: '4px 14px' }} onClick={cancel}>Cancel</button>
            </div>
        }
      </div>

      {editing ? (
        <div className="kit-form">
          {/* Row 1: Supplier + Cartage */}
          <div className="kit-row">
            <div className="kit-field">
              <label className="kit-label">Supplier</label>
              <select className="kit-select" value={draft.supplier} onChange={e => set('supplier', e.target.value)}>
                <option value="">— Select —</option>
                <option value="GH">GH</option>
                <option value="JDN">JDN</option>
              </select>
            </div>
            <div className="kit-field">
              <label className="kit-label">Cartage</label>
              <div className="kit-cartage-toggle">
                <button
                  type="button"
                  className={`kit-cartage-btn${draft.cartage === 'sea' ? ' active' : ''}`}
                  onClick={() => set('cartage', draft.cartage === 'sea' ? '' : 'sea')}
                >🚢 Sea</button>
                <button
                  type="button"
                  className={`kit-cartage-btn${draft.cartage === 'air' ? ' active' : ''}`}
                  onClick={() => set('cartage', draft.cartage === 'air' ? '' : 'air')}
                >✈️ Air</button>
              </div>
            </div>
          </div>

          {/* Row 2: Dates */}
          <div className="kit-row kit-dates-row">
            {[['kitProduction','Kit Production'],['kitReady','Kit Ready'],['sent','Sent'],['arrived','Arrived']].map(([field, label]) => (
              <div key={field} className="kit-field">
                <label className="kit-label">{label}</label>
                <input type="date" className="kit-date-input" value={draft[field]} onChange={e => set(field, e.target.value)} />
              </div>
            ))}
          </div>

          {/* Row 3: Tracking link */}
          <div className="kit-row">
            <div className="kit-field" style={{ flex: 1 }}>
              <label className="kit-label">Tracking Link</label>
              <input
                type="url"
                className="kit-url-input"
                value={draft.trackingLink}
                onChange={e => set('trackingLink', e.target.value)}
                placeholder="https://track.carrier.com/…"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="kit-view">
          <div className="kit-view-row">
            <div className="kit-view-cell">
              <span className="kit-view-label">Supplier</span>
              <span className="kit-view-val">{k.supplier || '—'}</span>
            </div>
            <div className="kit-view-cell">
              <span className="kit-view-label">Cartage</span>
              <span className="kit-view-val">
                {k.cartage === 'sea' ? '🚢 Sea freight' : k.cartage === 'air' ? '✈️ Air freight' : '—'}
              </span>
            </div>
            <div className="kit-view-cell">
              <span className="kit-view-label">Kit Production</span>
              <span className="kit-view-val">{fmtDate(k.kitProduction)}</span>
            </div>
            <div className="kit-view-cell">
              <span className="kit-view-label">Kit Ready</span>
              <span className="kit-view-val">{fmtDate(k.kitReady)}</span>
            </div>
            <div className="kit-view-cell">
              <span className="kit-view-label">Sent</span>
              <span className="kit-view-val">{fmtDate(k.sent)}</span>
            </div>
            <div className="kit-view-cell">
              <span className="kit-view-label">Arrived</span>
              <span className="kit-view-val">{fmtDate(k.arrived)}</span>
            </div>
          </div>
          <div className="kit-view-track">
            <span className="kit-view-label">Track</span>
            {k.trackingLink
              ? <a href={k.trackingLink} target="_blank" rel="noopener noreferrer" className="kit-track-link">
                  {k.trackingLink} ↗
                </a>
              : <span className="kit-view-val">—</span>
            }
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
