import { useState } from 'react'
import { PREP_STAGES, MILESTONES, MON_NAMES, parseDate, getProjectMilestones } from '../lib/constants'

const TODAY = new Date()
TODAY.setHours(0, 0, 0, 0)

/* ── helpers ── */
function getMobStatus(mob) {
  if (!mob.start) return null
  const start = parseDate(mob.start)
  const end   = mob.end ? parseDate(mob.end) : start
  if (TODAY > end)              return { type: 'past',    start, end }
  if (TODAY >= start)           return { type: 'active',  start, end }
  const daysUntil = Math.ceil((start - TODAY) / 86400000)
  return { type: 'upcoming', start, end, daysUntil }
}

function getNextMobEntry(project) {
  const entries = Object.entries(project.mobs || {})
    .map(([key, mob]) => ({ key, mob, status: getMobStatus(mob) }))
    .filter(e => e.status)
    .sort((a, b) => a.status.start - b.status.start)
  return entries.find(e => e.status.type !== 'past') || entries[entries.length - 1] || null
}

function fmtShort(d) {
  return `${d.getDate()} ${MON_NAMES[d.getMonth()]}`
}

function getMinPrep(project) {
  const preps = Object.values(project.mobs || {}).map(m => m.prep || 0)
  return preps.length ? Math.min(...preps) : 0
}

/* ── Ship progress track ── */
function ShipTrack({ project }) {
  const entry = getNextMobEntry(project)
  if (!entry) {
    return <span className="hub-no-mob">No mob scheduled</span>
  }

  const { status, mob } = entry
  let progress, label, trackColor, arrived

  if (status.type === 'past' || status.type === 'active') {
    progress   = 1
    arrived    = true
    label      = status.type === 'active' ? 'On site' : 'Complete'
    trackColor = 'var(--green)'
  } else {
    const d = status.daysUntil
    // Bar stays empty beyond 21 days, then ramps up through the monitoring window
    progress   = d >= 21 ? 0.03 : 0.03 + ((21 - d) / 21) * 0.82
    arrived    = false
    label      = d === 1 ? 'Tomorrow' : d <= 21 ? `${d}d away` : fmtShort(status.start)
    trackColor = d <= 7 ? 'var(--amber)' : d <= 21 ? 'var(--blue)' : 'var(--text-3)'
  }

  const pct = `${(progress * 100).toFixed(1)}%`

  return (
    <div className="ship-track-wrap">
      <div className="ship-track">
        <div className="ship-track-rail" />
        <div className="ship-track-fill" style={{ width: pct, background: trackColor }} />
        <div className="ship-track-dot-end" style={{ background: arrived ? trackColor : 'var(--border-md)' }} />
      </div>
      <span className="ship-label" style={{ color: trackColor }}>{label}</span>
    </div>
  )
}

/* ── Prep dots ── */
function PrepDots({ prep }) {
  return (
    <div className="hub-prep-dots">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="hub-dot"
          style={{ background: i < prep ? 'var(--blue)' : 'var(--border-md)' }}
        />
      ))}
      <span className="hub-prep-label">{prep}/5</span>
    </div>
  )
}

/* ── Overview stats ── */
function getStats(projects) {
  let onSite = 0, soon = 0, fullyPrepped = 0

  projects.forEach(p => {
    const entry = getNextMobEntry(p)
    if (entry?.status.type === 'active') onSite++
    if (entry?.status.type === 'upcoming' && entry.status.daysUntil <= 14) soon++
    const preps = Object.values(p.mobs || {}).map(m => m.prep || 0)
    if (preps.length && Math.min(...preps) >= 5) fullyPrepped++
  })

  // next upcoming mob across all projects
  let nextProject = null, nextDays = Infinity
  projects.forEach(p => {
    const entry = getNextMobEntry(p)
    if (entry?.status.type === 'upcoming' && entry.status.daysUntil < nextDays) {
      nextDays    = entry.status.daysUntil
      nextProject = p
    }
  })

  return { onSite, soon, fullyPrepped, nextProject, nextDays }
}

/* ── Kit timeline ── */
const ORANGE = '#E8830A'
const GREEN  = '#0F6E56'
const GREY   = '#D1D0CC'

function daysDiff(a, b) { return Math.max(1, Math.round((b - a) / 86400000)) }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

function KitTimeline({ kit }) {
  if (!kit) return null

  const hasProd = kit.kitProduction && kit.kitReady
  const hasShip = kit.sent && kit.arrived
  if (!hasProd && !hasShip) return null

  const fmtD = d => `${d.getDate()} ${MON_NAMES[d.getMonth()]}`
  const shipIcon = kit.cartage === 'air' ? '✈️' : '🚢'

  // Production phase
  const prodStart = hasProd ? parseDate(kit.kitProduction) : null
  const prodEnd   = hasProd ? parseDate(kit.kitReady)      : null
  const prodDays  = hasProd ? daysDiff(prodStart, prodEnd) : 0
  const prodDone  = hasProd && TODAY >= prodEnd
  const prodActive= hasProd && TODAY >= prodStart && TODAY < prodEnd
  const prodProg  = prodDone ? 1 : prodActive ? clamp((TODAY - prodStart) / (prodEnd - prodStart), 0, 1) : 0
  const prodColor = prodDone ? GREEN : prodActive ? ORANGE : GREY

  // Shipping phase
  const shipStart = hasShip ? parseDate(kit.sent)    : null
  const shipEnd   = hasShip ? parseDate(kit.arrived) : null
  const shipDays  = hasShip ? daysDiff(shipStart, shipEnd) : 0
  const shipDone  = hasShip && TODAY >= shipEnd
  const shipActive= hasShip && TODAY >= shipStart && TODAY < shipEnd
  const shipProg  = shipDone ? 1 : shipActive ? clamp((TODAY - shipStart) / (shipEnd - shipStart), 0, 1) : 0
  const shipColor = shipDone ? GREEN : shipActive ? ORANGE : GREY

  const totalDays = prodDays + shipDays
  const prodFlex  = totalDays ? prodDays / totalDays : 1
  const shipFlex  = totalDays ? shipDays / totalDays : 1

  return (
    <div className="bar-section" onClick={e => e.stopPropagation()}>
      <span className="tl-section-label">Kit Progress</span>
    <div className="kit-timeline-wrap">

      {/* Start dot */}
      <div className="kit-tl-node">
        <div className="kit-tl-dot" style={{ background: prodProg > 0 || (!hasProd && shipProg > 0) ? (hasProd ? prodColor : shipColor) : GREY }} />
        <span className="kit-tl-lbl">{hasProd ? fmtD(prodStart) : fmtD(shipStart)}</span>
      </div>

      {/* Production segment */}
      {hasProd && (
        <>
          <div className="kit-tl-seg" style={{ flexGrow: prodFlex }}>
            <div className="kit-tl-track" />
            <div className="kit-tl-fill" style={{ width: `${prodProg * 100}%`, background: prodColor }} />
            {!prodDone && (
              <div className="kit-tl-icon" style={{ left: `${prodProg * 100}%` }} title="Kit production">📦</div>
            )}
            <span className="kit-tl-seg-lbl" style={{ color: prodColor }}>
              {prodDone ? 'Ready' : prodActive ? 'In production' : 'Production'}
            </span>
          </div>
          <div className="kit-tl-node">
            <div className="kit-tl-dot" style={{ background: prodDone ? GREEN : GREY }} />
            <span className="kit-tl-lbl">{fmtD(prodEnd)}</span>
          </div>
        </>
      )}

      {/* Shipping segment */}
      {hasShip && (
        <>
          <div className="kit-tl-seg" style={{ flexGrow: shipFlex }}>
            <div className="kit-tl-track" />
            <div className="kit-tl-fill" style={{ width: `${shipProg * 100}%`, background: shipColor }} />
            {!shipDone && (
              <div className="kit-tl-icon" style={{ left: `${shipProg * 100}%` }} title="In transit">
                {shipIcon}
              </div>
            )}
            <span className="kit-tl-seg-lbl" style={{ color: shipColor }}>
              {shipDone ? 'Arrived' : shipActive ? 'In transit' : 'Shipping'}
            </span>
          </div>
          <div className="kit-tl-node">
            <div className="kit-tl-dot" style={{ background: shipDone ? GREEN : GREY }} />
            <span className="kit-tl-lbl">{fmtD(shipEnd)}</span>
          </div>
        </>
      )}
    </div>
    </div>
  )
}

/* ── Milestone bar (display only in hub) ── */
function MilestoneBar({ project }) {
  const milestones = getProjectMilestones(project)
  return (
    <div className="bar-section">
      <span className="tl-section-label">Milestones</span>
      <div className="milestone-bar">
      {milestones.map((m, i, arr) => {
        const isCurrent = !m.done && (i === 0 || arr[i - 1].done)
        return (
          <div key={m.key || i} className="ms-item">
            {i > 0 && <div className={`ms-seg${m.done ? ' complete' : ''}`} />}
            <div
              className={`ms-node${m.done ? ' complete' : isCurrent ? ' current' : ''}`}
              title={m.label}
            >
              <div className="ms-dot" />
              <div className="ms-lbl">{m.short || m.label}</div>
            </div>
          </div>
        )
      })}
      </div>
    </div>
  )
}

/* ── Main component ── */
export default function ProjectsHub({ projects, onOpenProject }) {
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('nextMob')

  const stats = getStats(projects)

  const filtered = projects.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.projNum.toLowerCase().includes(q) ||
      p.projName.toLowerCase().includes(q) ||
      (p.client || '').toLowerCase().includes(q) ||
      (p.region || '').toLowerCase().includes(q)
    )
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'nextMob') {
      const ea = getNextMobEntry(a)
      const eb = getNextMobEntry(b)
      const da = ea?.status.start?.getTime() ?? Infinity
      const db = eb?.status.start?.getTime() ?? Infinity
      return da - db
    }
    if (sortBy === 'num')  return a.projNum.localeCompare(b.projNum)
    if (sortBy === 'name') return a.projName.localeCompare(b.projName)
    if (sortBy === 'prep') return getMinPrep(a) - getMinPrep(b)
    return 0
  })

  function SortBtn({ col, label }) {
    return (
      <button
        className={`hub-sort-btn${sortBy === col ? ' active' : ''}`}
        onClick={() => setSortBy(col)}
      >
        {label}{sortBy === col ? ' ↑' : ''}
      </button>
    )
  }

  return (
    <div className="hub-page">

      {/* Overview row */}
      <div className="hub-overview">
        <div className="metric-card">
          <div className="metric-val">{projects.length}</div>
          <div className="metric-lbl">Total projects</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: stats.onSite > 0 ? 'var(--green)' : undefined }}>
            {stats.onSite}
          </div>
          <div className="metric-lbl">On site now</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: stats.soon > 0 ? 'var(--amber)' : undefined }}>
            {stats.soon}
          </div>
          <div className="metric-lbl">Mobs in 14 days</div>
        </div>
        <div className="metric-card">
          <div className="metric-val" style={{ color: stats.fullyPrepped > 0 ? 'var(--green)' : undefined }}>
            {stats.fullyPrepped}
          </div>
          <div className="metric-lbl">Fully prepped</div>
        </div>
        {stats.nextProject && (
          <div className="metric-card hub-next-card" onClick={() => onOpenProject(stats.nextProject)} style={{ cursor: 'pointer' }}>
            <div className="metric-val" style={{ fontSize: 14 }}>{stats.nextProject.projName}</div>
            <div className="metric-lbl">Next mob — {stats.nextDays}d away</div>
          </div>
        )}
      </div>

      {/* Search + sort toolbar */}
      <div className="hub-toolbar">
        <input
          className="hub-search"
          placeholder="Search by project, client, region…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="hub-sort-row">
          <span className="hub-sort-label">Sort:</span>
          <SortBtn col="nextMob" label="Next mob" />
          <SortBtn col="num"     label="Proj #" />
          <SortBtn col="name"    label="Name" />
          <SortBtn col="prep"    label="Prep" />
        </div>
      </div>

      {/* Project rows */}
      {sorted.length === 0 && (
        <div className="empty-state">
          {projects.length === 0 ? 'No projects yet — add one using the Add project tab' : 'No results for that search'}
        </div>
      )}

      <div className="hub-list">
        {sorted.map(project => {
          const entry    = getNextMobEntry(project)
          const minPrep  = getMinPrep(project)
          const mobCount = Object.keys(project.mobs || {}).length
          const c        = project.colour || {}

          let mobLabel = '—'
          let statusBadge = project.onHold
            ? <span className="hub-badge on-hold">⏸ On Hold</span>
            : null
          if (!project.onHold && entry) {
            const { status, mob } = entry
            if (status.type === 'active') {
              mobLabel = `${mob.phase} · until ${fmtShort(status.end)}`
              statusBadge = <span className="hub-badge on-site">On site</span>
            } else if (status.type === 'upcoming') {
              mobLabel = `${mob.phase} · ${fmtShort(status.start)}`
              statusBadge = status.daysUntil <= 7
                ? <span className="hub-badge soon">Soon</span>
                : null
            } else {
              mobLabel = `${mob.phase} · ${fmtShort(status.end)}`
              statusBadge = <span className="hub-badge done">Done</span>
            }
          }

          return (
            <div
              key={project.projNum}
              className={`hub-row${project.onHold ? ' on-hold' : ''}`}
              style={{ borderLeftColor: c.border || 'var(--border-md)' }}
              onClick={() => onOpenProject(project)}
            >
              {/* Main row */}
              <div className="hub-row-main">
                {/* Left: project identity */}
                <div className="hub-col-identity">
                  <div className="hub-proj-num" style={{ color: c.num || 'var(--blue)' }}>
                    {project.projNum}
                  </div>
                  <div className="hub-proj-name">{project.projName}</div>
                  <div className="hub-proj-meta">
                    {project.client && <span>{project.client}</span>}
                    {project.client && project.region && <span className="hub-sep">·</span>}
                    {project.region && <span>{project.region}</span>}
                  </div>
                </div>

                {/* Centre: next mob + status badge */}
                <div className="hub-col-mob">
                  <div className="hub-mob-line">
                    {statusBadge}
                    <span className="hub-mob-label">{mobLabel}</span>
                  </div>
                  <div className="hub-mob-count">{mobCount} mob{mobCount !== 1 ? 's' : ''}</div>
                </div>

                {/* Ship track */}
                <div className="hub-col-track">
                  <ShipTrack project={project} />
                </div>

                {/* Prep dots */}
                <div className="hub-col-prep">
                  <PrepDots prep={minPrep} />
                </div>

                <div className="hub-col-arrow">›</div>
              </div>

              {/* Kit timeline — only shown when kit dates are entered */}
              <KitTimeline kit={project.kit} />

              {/* Milestone bar — display only */}
              <MilestoneBar project={project} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
