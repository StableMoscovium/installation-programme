import { fmtDate, addDays, DAY_NAMES, MON_NAMES, PREP_STAGES } from '../lib/constants'

const TODAY = new Date()

export default function PrepSummary({ projects }) {
  const weekDates = Array.from({ length: 7 }, (_, i) => fmtDate(addDays(TODAY, i)))

  const weekTasks = []
  projects.forEach(proj => {
    Object.entries(proj.mobs || {}).forEach(([mobKey, mob], mi) => {
      const daysThisWeek = Object.keys(mob.days || {}).filter(iso => weekDates.includes(iso))
      if (daysThisWeek.length > 0) {
        weekTasks.push({
          proj,
          mob,
          mobIndex: mi,
          days: daysThisWeek.sort(),
          prep: proj.prep || 0,
          fullyPrepped: (proj.prep || 0) >= 5,
        })
      }
    })
  })

  const flagged = weekTasks.filter(t => !t.fullyPrepped)
  const clear   = weekTasks.filter(t => t.fullyPrepped)

  const startDate = TODAY
  const endDate   = addDays(TODAY, 6)
  const rangeLabel = `${startDate.getDate()} ${MON_NAMES[startDate.getMonth()]} – ${endDate.getDate()} ${MON_NAMES[endDate.getMonth()]} ${endDate.getFullYear()}`

  return (
    <div className="report-page">
      <div className="report-header">
        <div>
          <h2 className="report-title">Weekly prep report</h2>
          <p className="report-sub">{rangeLabel}</p>
        </div>
      </div>

      {projects.length === 0 && (
        <div className="empty-state">No projects added yet. Add a project to see the prep report.</div>
      )}

      {projects.length > 0 && (
        <>
          <div className="report-metrics">
            <div className="metric-card">
              <div className="metric-val">{weekTasks.length}</div>
              <div className="metric-lbl">Mobs active this week</div>
            </div>
            <div className="metric-card">
              <div className="metric-val green">{clear.length}</div>
              <div className="metric-lbl">Fully prepped</div>
            </div>
            <div className="metric-card">
              <div className="metric-val red">{flagged.length}</div>
              <div className="metric-lbl">Need attention</div>
            </div>
            <div className="metric-card">
              <div className="metric-val">{projects.length}</div>
              <div className="metric-lbl">Total projects</div>
            </div>
          </div>

          {flagged.length > 0 && (
            <div className="report-section">
              <div className="report-section-label flagged">⚠ Needs attention</div>
              {flagged.map((t, i) => (
                <PrepRow key={i} task={t} flagged />
              ))}
            </div>
          )}

          {clear.length > 0 && (
            <div className="report-section">
              <div className="report-section-label clear">✓ Fully prepped</div>
              {clear.map((t, i) => (
                <PrepRow key={i} task={t} flagged={false} />
              ))}
            </div>
          )}

          {weekTasks.length === 0 && (
            <div className="empty-state">No mobilisations scheduled for this week.</div>
          )}
        </>
      )}
    </div>
  )
}

function PrepRow({ task, flagged }) {
  const { proj, mob, mobIndex, days, prep } = task
  const missingStages = PREP_STAGES.slice(prep).map(s => s.label.replace(/^\d · /, ''))
  const firstDay = days[0]

  return (
    <div className={`prep-row-card${flagged ? ' flagged' : ' clear'}`}>
      <div className="prep-row-left">
        <div className="prep-row-num" style={{ color: proj.colour?.num }}>{proj.projNum}</div>
        <div className="prep-row-name">{proj.projName}</div>
        <div className="prep-row-mob">MOB-{mobIndex + 1} · {mob.phase}</div>
        {proj.address && <div className="prep-row-loc">📍 {proj.address}</div>}
      </div>
      <div className="prep-row-dots">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="dot-lg"
            style={{
              background: i < prep
                ? (flagged ? '#A32D2D' : proj.colour?.dotOn)
                : (flagged ? '#F7C1C1' : proj.colour?.dotOff),
              border: i < prep ? 'none' : '0.5px solid #ccc'
            }}
          />
        ))}
      </div>
      {flagged && missingStages.length > 0 && (
        <div className="prep-row-missing">
          {missingStages.join(', ')} outstanding
        </div>
      )}
      {!flagged && (
        <div className="prep-row-ok">All clear</div>
      )}
    </div>
  )
}
