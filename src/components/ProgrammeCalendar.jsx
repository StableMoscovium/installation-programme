import { useState } from 'react'
import {
  EQUIPMENT, EQ_MAP,
  MON_NAMES, DAY_NAMES,
  fmtDate, addDays, parseDate, daysBetween, weekNumber
} from '../lib/constants'

const TODAY = new Date()

function getMondayOf(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day  // Sunday → back 6, otherwise back to Mon
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

const THIS_MONDAY = getMondayOf(TODAY)

export default function ProgrammeCalendar({ projects, onOpenProject }) {
  const [offset, setOffset] = useState(0)

  const start = addDays(THIS_MONDAY, offset * 7)
  const days  = Array.from({ length: 21 }, (_, i) => addDays(start, i))
  const end   = days[20]

  const rangeLabel = `${start.getDate()} ${MON_NAMES[start.getMonth()]} – ${end.getDate()} ${MON_NAMES[end.getMonth()]} ${end.getFullYear()}`
  const weekLabel  = `Weeks ${weekNumber(days[0])} – ${weekNumber(days[14])}`

  const byDay = {}
  days.forEach(d => { byDay[fmtDate(d)] = [] })
  projects.forEach(proj => {
    Object.keys(proj.mobs || {}).forEach(mobKey => {
      const mob = proj.mobs[mobKey]
      if (!mob.start || !mob.end) return
      daysBetween(parseDate(mob.start), parseDate(mob.end)).forEach(iso => {
        if (mob.standDown?.[iso]) return  // skip stand-down days
        if (byDay[iso] !== undefined) {
          byDay[iso].push({ proj, mob, mobKey, iso })
        }
      })
    })
  })

  const weeks = [days.slice(0, 7), days.slice(7, 14), days.slice(14, 21)]

  return (
    <div className="calendar-wrap">
      <div className="cal-toolbar">
        <div className="cal-toolbar-left">
          <button className="today-btn" onClick={() => setOffset(0)}>Today</button>
          <button className="nav-btn" onClick={() => setOffset(o => o - 1)}>‹</button>
          <span className="wk-label">{weekLabel}</span>
          <button className="nav-btn" onClick={() => setOffset(o => o + 1)}>›</button>
          <span className="range-label">{rangeLabel}</span>
        </div>
        <div className="cal-toolbar-right">
          {projects.length === 0 && (
            <span className="empty-hint">No projects yet — add one using the "Add project" tab</span>
          )}
        </div>
      </div>

      <div className="equip-legend">
        <span className="legend-heading">Plant & equipment:</span>
        {EQUIPMENT.map(e => (
          <span key={e.code} className="legend-item">
            <span className="legend-chip" style={{ background: e.bg, color: e.col }}>{e.label}</span>
            {e.title}
          </span>
        ))}
      </div>

      <div className="cal-grid">
        {weeks.map((week, wi) => (
          <div key={wi} className="week-row">
            {week.map(d => {
              const iso     = fmtDate(d)
              const isToday = iso === fmtDate(TODAY)
              const entries = byDay[iso] || []
              return (
                <div key={iso} className={`day-col${isToday ? ' today' : ''}`}>
                  <div className="day-hd">
                    <div className="day-name">{DAY_NAMES[d.getDay()]}</div>
                    <div className="day-date">{d.getDate()} {MON_NAMES[d.getMonth()]}</div>
                  </div>
                  <div className="day-body">
                    {entries.length === 0
                      ? <div className="empty-day">—</div>
                      : entries.map(({ proj, mob, mobKey, iso: entryIso }) => (
                          <MobCard
                            key={`${proj.projNum}-${mobKey}-${entryIso}`}
                            proj={proj}
                            mob={mob}
                            mobKey={mobKey}
                            iso={entryIso}
                            onClick={() => onOpenProject(proj)}
                          />
                        ))
                    }
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function MobCard({ proj, mob, iso, onClick }) {
  const colour = proj.colour
  const eq = mob.days?.[iso] || []

  return (
    <div
      className="mob-card"
      style={{
        background: colour.bg,
        borderLeftColor: colour.border,
        cursor: 'pointer',
      }}
      onClick={onClick}
    >
      <div className="mob-proj-num" style={{ color: colour.num }}>{proj.projNum}</div>
      <div className="mob-proj-name" style={{ color: colour.text }}>{proj.projName}</div>
      <div className="mob-phase" style={{ color: colour.text }}>{mob.phase}</div>
      {eq.length > 0 && (
        <div className="mob-eq-row">
          {eq.map(code => {
            const e = EQ_MAP[code]
            return e
              ? <span key={code} className="mob-eq-chip" style={{ background: e.bg, color: e.col }}>{e.label}</span>
              : null
          })}
        </div>
      )}
      <div className="mob-dots">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="dot"
            style={{ background: i < (mob.prep || 0) ? colour.dotOn : colour.dotOff }}
          />
        ))}
      </div>
    </div>
  )
}
