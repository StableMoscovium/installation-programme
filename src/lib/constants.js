export const EQUIPMENT = [
  { code: 'AM', label: 'AM', title: 'Access machine',     bg: '#E6F1FB', col: '#185FA5' },
  { code: 'HB', label: 'HB', title: 'HIAB',               bg: '#FAEEDA', col: '#854F0B' },
  { code: 'TT', label: 'TT', title: 'Transport truck',    bg: '#FAECE7', col: '#993C1D' },
  { code: 'FK', label: 'FK', title: 'Forklift',            bg: '#EEEDFE', col: '#534AB7' },
  { code: 'PG', label: 'PG', title: 'Generator',           bg: '#EAF3DE', col: '#3B6D11' },
  { code: 'CO', label: 'CO', title: 'Contractor',          bg: '#FEF0FB', col: '#8B1A8B' },
  { code: 'IN', label: 'IN', title: 'Inspector',           bg: '#FFF8E6', col: '#8B6914' },
]

export const EQ_MAP = Object.fromEntries(EQUIPMENT.map(e => [e.code, e]))

export const TASK_LIBRARY = [
  'Travel',
  'Delivery',
  'Runway beam install',
  'Install runway rails',
  'Install hanger brackets',
  'Install end stops',
  'Crane install',
  'Commissioning',
  'Load testing',
  'Site survey',
  'Concrete anchor install',
  'Electrical connection',
]

export const PREP_STAGES = [
  { key: 'scheduled',   label: '1 · Scheduled',              cls: 'p1' },
  { key: 'notified',    label: '2 · Stakeholders notified',   cls: 'p2' },
  { key: 'plant',       label: '3 · Plant confirmed',          cls: 'p3' },
  { key: 'equipment',   label: '4 · Equipment ready',          cls: 'p4' },
  { key: 'hs',          label: '5 · H&S complete',             cls: 'p5' },
]

export const PROJECT_COLOURS = [
  { key: 'm-blue',   bg: '#E6F1FB', border: '#185FA5', num: '#185FA5', text: '#042C53', dotOn: '#185FA5', dotOff: '#B5D4F4' },
  { key: 'm-teal',   bg: '#E1F5EE', border: '#0F6E56', num: '#0F6E56', text: '#04342C', dotOn: '#0F6E56', dotOff: '#9FE1CB' },
  { key: 'm-purple', bg: '#EEEDFE', border: '#534AB7', num: '#534AB7', text: '#26215C', dotOn: '#534AB7', dotOff: '#CECBF6' },
  { key: 'm-amber',  bg: '#FAEEDA', border: '#BA7517', num: '#854F0B', text: '#412402', dotOn: '#BA7517', dotOff: '#FAC775' },
  { key: 'm-coral',  bg: '#FAECE7', border: '#993C1D', num: '#993C1D', text: '#4A1B0C', dotOn: '#993C1D', dotOff: '#F5C4B3' },
]

export const REGIONS = [
  'Auckland',
  'Bay of Plenty',
  'Canterbury / Otago',
  'Hawke\'s Bay',
  'Manawatū / Whanganui',
  'Nelson / Marlborough',
  'Northland',
  'Otago / Southland',
  'Taranaki',
  'Waikato',
  'Wellington',
  'West Coast',
  'Other',
]

export const MON_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
export const DAY_NAMES  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function daysBetween(start, end) {
  const days = []
  let cur = new Date(start)
  while (cur <= end) {
    days.push(fmtDate(cur))
    cur = addDays(cur, 1)
  }
  return days
}

export function weekNumber(d) {
  const jan1 = new Date(d.getFullYear(), 0, 1)
  return Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7)
}

export function colourForIndex(i) {
  return PROJECT_COLOURS[i % PROJECT_COLOURS.length]
}
