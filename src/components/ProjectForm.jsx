import { useState, useEffect } from 'react'
import {
  EQUIPMENT, TASK_LIBRARY, PREP_STAGES, REGIONS, PROJECT_COLOURS,
  MON_NAMES, DAY_NAMES,
  fmtDate, parseDate, addDays, daysBetween,
  defaultMilestonesList,
} from '../lib/constants'

const BLANK_MOB = () => ({
  phase: 'Structural installation',
  start: '',
  end: '',
  tasks: [],
  days: {},
  standDown: {},
  prep: 0,
})

const BLANK_CONTACT = () => ({ role: '', name: '', phone: '', email: '' })

export default function ProjectForm({ initialData, onSave, onCancel }) {
  const [projNum,   setProjNum]   = useState('')
  const [projName,  setProjName]  = useState('')
  const [client,    setClient]    = useState('')
  const [address,   setAddress]   = useState('')
  const [region,    setRegion]    = useState('Canterbury / Otago')
  const [craneType, setCraneType] = useState('')
  const [scope,     setScope]     = useState('')
  const [contacts,  setContacts]  = useState([
    { role: 'Project manager',  name: '', phone: '', email: '' },
    { role: 'Site manager',     name: '', phone: '', email: '' },
    { role: 'Lead technician',  name: '', phone: '', email: '' },
    { role: 'Project sponsor',  name: '', phone: '', email: '' },
  ])
  const [mobs,      setMobs]      = useState([BLANK_MOB()])
  const [accessNotes, setAccessNotes] = useState('')
  const [hsNotes,   setHsNotes]   = useState('')
  const [genNotes,  setGenNotes]  = useState('')
  const [colour,    setColour]    = useState(PROJECT_COLOURS[0])
  const [projectStart,   setProjectStart]   = useState('')
  const [projectFinish,  setProjectFinish]  = useState('')
  const [actualFinish,   setActualFinish]   = useState('')
  const [milestone,      setMilestone]      = useState(0)
  const [milestonesList, setMilestonesList] = useState(defaultMilestonesList())
  const [newMilestone,   setNewMilestone]   = useState('')
  const [onHold,         setOnHold]         = useState(false)

  // Load existing project data for editing
  useEffect(() => {
    if (!initialData) return
    setProjNum(initialData.projNum || '')
    setProjName(initialData.projName || '')
    setClient(initialData.client || '')
    setAddress(initialData.address || '')
    setRegion(initialData.region || 'Canterbury / Otago')
    setCraneType(initialData.craneType || '')
    setScope(initialData.scope || '')
    setContacts(initialData.contacts || [BLANK_CONTACT()])
    setMobs(Object.values(initialData.mobs || { 0: BLANK_MOB() }))
    setAccessNotes(initialData.accessNotes || '')
    setHsNotes(initialData.hsNotes || '')
    setGenNotes(initialData.genNotes || '')
    setColour(initialData.colour || PROJECT_COLOURS[0])
    setProjectStart(initialData.projectStart || '')
    setProjectFinish(initialData.projectFinish || '')
    setActualFinish(initialData.actualFinish || '')
    setMilestone(initialData.milestone ?? 0)
    setMilestonesList(
      initialData.milestonesList?.length > 0
        ? initialData.milestonesList
        : defaultMilestonesList()
    )
    setOnHold(initialData.onHold ?? false)
  }, [initialData])

  function updateContact(i, field, val) {
    setContacts(prev => prev.map((c, ci) => ci === i ? { ...c, [field]: val } : c))
  }

  function addContact() {
    setContacts(prev => [...prev, BLANK_CONTACT()])
  }

  function removeContact(i) {
    setContacts(prev => prev.filter((_, ci) => ci !== i))
  }

  function updateMob(i, field, val) {
    setMobs(prev => prev.map((m, mi) => mi === i ? { ...m, [field]: val } : m))
  }

  function toggleTask(mobIdx, task) {
    setMobs(prev => prev.map((m, mi) => {
      if (mi !== mobIdx) return m
      const tasks = m.tasks.includes(task)
        ? m.tasks.filter(t => t !== task)
        : [...m.tasks, task]
      return { ...m, tasks }
    }))
  }

  function addCustomTask(mobIdx) {
    const name = window.prompt('Task name:')
    if (!name) return
    setMobs(prev => prev.map((m, mi) =>
      mi === mobIdx ? { ...m, tasks: [...m.tasks, name] } : m
    ))
  }

  function toggleStandDown(mobIdx, iso) {
    setMobs(prev => prev.map((m, mi) => {
      if (mi !== mobIdx) return m
      const sd = { ...(m.standDown || {}) }
      if (sd[iso]) { delete sd[iso] } else { sd[iso] = true }
      return { ...m, standDown: sd }
    }))
  }

  function toggleEquip(mobIdx, iso, code) {
    setMobs(prev => prev.map((m, mi) => {
      if (mi !== mobIdx) return m
      const current = m.days[iso] || []
      const updated = current.includes(code)
        ? current.filter(c => c !== code)
        : [...current, code]
      return { ...m, days: { ...m.days, [iso]: updated } }
    }))
  }

  function addMob() {
    setMobs(prev => [...prev, BLANK_MOB()])
  }

  function removeMob(i) {
    setMobs(prev => prev.filter((_, mi) => mi !== i))
  }

  function handleSave() {
    if (!projNum.trim() || !projName.trim()) {
      alert('Project number and name are required.')
      return
    }
    // colour comes from state — chosen by user
    const mobMap = {}
    mobs.forEach((m, i) => { mobMap[`mob${i}`] = m })

    onSave({
      projNum:     projNum.trim(),
      projName:    projName.trim(),
      client,
      address,
      region,
      craneType,
      scope,
      contacts,
      mobs:        mobMap,
      prep:        0,
      accessNotes,
      hsNotes,
      genNotes,
      colour,
      projectStart,
      projectFinish,
      actualFinish,
      milestone,
      milestonesList,
      onHold,
      kit:         initialData?.kit ?? null,
      createdAt:   initialData?.createdAt || new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    })
  }

  return (
    <div className="form-page">
      <div className="form-header">
        <div>
          <h2 className="form-title">{initialData ? `Edit — ${initialData.projNum} ${initialData.projName}` : 'New project'}</h2>
          <p className="form-sub">Complete each section — this record drives the programme calendar.</p>
        </div>
      </div>

      {/* PROJECT DETAILS */}
      <section className="form-section">
        <h3 className="section-heading">Project details</h3>
        <div className="field-grid g3">
          <div className="field">
            <label>Project number</label>
            <input value={projNum} onChange={e => setProjNum(e.target.value)} placeholder="e.g. 12016" />
          </div>
          <div className="field span2">
            <label>Project name</label>
            <input value={projName} onChange={e => setProjName(e.target.value)} placeholder="e.g. Hampden" />
          </div>
          <div className="field span3">
            <label>Client / company</label>
            <input value={client} onChange={e => setClient(e.target.value)} placeholder="Client name" />
          </div>
          <div className="field span2">
            <label>Site address</label>
            <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, town" />
          </div>
          <div className="field">
            <label>Region</label>
            <select value={region} onChange={e => setRegion(e.target.value)}>
              {REGIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="field span3">
            <label>Crane / equipment type</label>
            <input value={craneType} onChange={e => setCraneType(e.target.value)} placeholder="e.g. Overhead EOT 10t, Jib crane 2t" />
          </div>
          <div className="field span3">
            <label>Scope notes</label>
            <textarea value={scope} onChange={e => setScope(e.target.value)} placeholder="Brief description of overall scope…" rows={3} />
          </div>
          <div className="field">
            <label>Project start</label>
            <input type="date" value={projectStart} onChange={e => setProjectStart(e.target.value)} />
          </div>
          <div className="field">
            <label>Project finish</label>
            <input type="date" value={projectFinish} onChange={e => setProjectFinish(e.target.value)} />
          </div>
          <div className="field">
            <label>Actual finish</label>
            <input type="date" value={actualFinish} onChange={e => setActualFinish(e.target.value)} />
          </div>
          <div className="field span3">
            <label>Project colour</label>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              {PROJECT_COLOURS.map(c => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColour(c)}
                  title={c.key.replace('m-', '')}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: c.bg,
                    border: `3px solid ${c.border}`,
                    outline: colour.key === c.key ? `3px solid ${c.border}` : '3px solid transparent',
                    outlineOffset: 2,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CONTACTS */}
      <section className="form-section">
        <h3 className="section-heading">Contacts</h3>
        <div className="contact-header">
          <div>Role</div><div>Name</div><div>Phone</div><div>Email</div><div></div>
        </div>
        {contacts.map((c, i) => (
          <div key={i} className="contact-row">
            <input value={c.role}  onChange={e => updateContact(i, 'role',  e.target.value)} placeholder="Role" />
            <input value={c.name}  onChange={e => updateContact(i, 'name',  e.target.value)} placeholder="Full name" />
            <input value={c.phone} onChange={e => updateContact(i, 'phone', e.target.value)} placeholder="+64" type="tel" />
            <input value={c.email} onChange={e => updateContact(i, 'email', e.target.value)} placeholder="email@" type="email" />
            <button className="remove-btn" onClick={() => removeContact(i)} title="Remove">×</button>
          </div>
        ))}
        <button className="add-link" onClick={addContact}>+ Add contact</button>
      </section>

      {/* MOBILISATIONS — each with prep status alongside */}
      <section className="form-section">
        <h3 className="section-heading">Mobilisations</h3>
        {mobs.map((mob, mi) => (
          <div key={mi} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <MobBlock
                mob={mob}
                mobIndex={mi}
                onUpdate={(field, val) => updateMob(mi, field, val)}
                onToggleTask={task => toggleTask(mi, task)}
                onAddCustomTask={() => addCustomTask(mi)}
                onToggleEquip={(iso, code) => toggleEquip(mi, iso, code)}
                onToggleStandDown={(iso) => toggleStandDown(mi, iso)}
                onRemove={mobs.length > 1 ? () => removeMob(mi) : null}
              />
            </div>
            <div style={{ width: 220, flexShrink: 0, paddingTop: 4 }}>
              <div className="mob-block" style={{ padding: '12px 14px' }}>
                <div className="field-sub-label" style={{ marginBottom: 8 }}>Prep status</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {PREP_STAGES.map((stage, i) => (
                    <button
                      key={stage.key}
                      type="button"
                      className={`prep-chip ${stage.cls}${(mob.prep || 0) > i ? ' on' : ''}`}
                      onClick={() => updateMob(mi, 'prep', (mob.prep || 0) > i ? i : i + 1)}
                      style={{ textAlign: 'left', width: '100%' }}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        <button className="add-link" onClick={addMob}>+ Add mobilisation</button>
      </section>

      {/* MILESTONES */}
      <section className="form-section">
        <h3 className="section-heading">Project milestones</h3>
        <p className="section-sub">Standard lifecycle stages are pre-loaded. Add or remove milestones to match this project's specific requirements.</p>
        <div className="milestone-form-list">
          {milestonesList.map((m, i) => (
            <div key={m.key || i} className="milestone-form-row">
              <span className="milestone-form-num">{i + 1}</span>
              <span className="milestone-form-label">{m.label}</span>
              <button
                type="button"
                className="milestone-form-remove"
                onClick={() => setMilestonesList(milestonesList.filter((_, idx) => idx !== i))}
                title="Remove"
              >×</button>
            </div>
          ))}
        </div>
        <div className="lifecycle-add-row" style={{ marginTop: 12 }}>
          <input
            className="lifecycle-add-input"
            placeholder="Add custom milestone…"
            value={newMilestone}
            onChange={e => setNewMilestone(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newMilestone.trim()) {
                setMilestonesList([...milestonesList, { key: `custom_${Date.now()}`, label: newMilestone.trim(), done: false, custom: true }])
                setNewMilestone('')
              }
            }}
          />
          <button
            type="button"
            className="lifecycle-add-btn"
            disabled={!newMilestone.trim()}
            onClick={() => {
              setMilestonesList([...milestonesList, { key: `custom_${Date.now()}`, label: newMilestone.trim(), done: false, custom: true }])
              setNewMilestone('')
            }}
          >+ Add</button>
        </div>
      </section>

      {/* NOTES */}
      <section className="form-section">
        <h3 className="section-heading">Notes</h3>
        <div className="field-grid g3">
          <div className="field">
            <label>Site access</label>
            <textarea value={accessNotes} onChange={e => setAccessNotes(e.target.value)} placeholder="Gate codes, parking, restricted zones, hours…" rows={3} />
          </div>
          <div className="field">
            <label>H&S requirements</label>
            <textarea value={hsNotes} onChange={e => setHsNotes(e.target.value)} placeholder="PPE, permits, inductions, exclusion zones…" rows={3} />
          </div>
          <div className="field">
            <label>General notes</label>
            <textarea value={genNotes} onChange={e => setGenNotes(e.target.value)} placeholder="Anything else the team needs to know…" rows={3} />
          </div>
        </div>
      </section>

      <div className="form-actions">
        <button className="btn btn-primary" onClick={handleSave}>Save & show on calendar</button>
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  )
}

function MobBlock({ mob, mobIndex, onUpdate, onToggleTask, onAddCustomTask, onToggleEquip, onToggleStandDown, onRemove }) {
  const days = mob.start && mob.end
    ? daysBetween(parseDate(mob.start), parseDate(mob.end))
    : []

  const allTasks = [...new Set([...TASK_LIBRARY, ...mob.tasks])]

  return (
    <div className="mob-block">
      <div className="mob-block-header">
        <span className="mob-block-label">MOB-{mobIndex + 1}</span>
        {onRemove && <button className="remove-btn" onClick={onRemove}>Remove</button>}
      </div>

      <div className="field-grid g2" style={{ marginBottom: 12 }}>
        <div className="field">
          <label>Start date</label>
          <input type="date" value={mob.start} onChange={e => onUpdate('start', e.target.value)} />
        </div>
        <div className="field">
          <label>End date</label>
          <input type="date" value={mob.end} onChange={e => onUpdate('end', e.target.value)} />
        </div>
        <div className="field span2">
          <label>Phase label (shown on calendar)</label>
          <input value={mob.phase} onChange={e => onUpdate('phase', e.target.value)} placeholder="e.g. Structural installation" />
        </div>
      </div>

      <div className="field-sub-label">Tasks in this mob</div>
      <div className="task-chips">
        {allTasks.map(task => (
          <button
            key={task}
            className={`task-chip${mob.tasks.includes(task) ? ' on' : ''}`}
            onClick={() => onToggleTask(task)}
          >
            {task}
          </button>
        ))}
        <button className="task-chip dashed" onClick={onAddCustomTask}>+ Custom</button>
      </div>

      {days.length > 0 && (
        <>
          <div className="field-sub-label" style={{ marginTop: 12 }}>Plant & equipment per day</div>
          <div className="eq-day-list">
            {days.map(iso => {
              const d = parseDate(iso)
              const label = `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MON_NAMES[d.getMonth()]}`
              const active = mob.days?.[iso] || []
              const isSD = !!(mob.standDown?.[iso])
              return (
                <div key={iso} className={`eq-day-row${isSD ? ' sd-day' : ''}`}>
                  <span className="eq-day-label">{label}</span>
                  {isSD
                    ? <span className="sd-label">Stand Down</span>
                    : (
                      <div className="eq-toggles">
                        {EQUIPMENT.map(eq => (
                          <button
                            key={eq.code}
                            className={`eq-toggle${active.includes(eq.code) ? ' on' : ''}`}
                            style={{ background: eq.bg, color: eq.col }}
                            onClick={() => onToggleEquip(iso, eq.code)}
                            title={eq.title}
                          >
                            {eq.label}
                          </button>
                        ))}
                      </div>
                    )
                  }
                  <button
                    className={`sd-toggle${isSD ? ' on' : ''}`}
                    onClick={() => onToggleStandDown(iso)}
                    title="Mark as Stand Down — hides this day from the calendar"
                    type="button"
                  >SD</button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
