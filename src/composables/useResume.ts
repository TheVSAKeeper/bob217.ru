import { computed, type ComputedRef } from 'vue'
import { LANG_COLORS } from '@/utils/lang'
import { fmtMonthYear, fmtSpan, monthIndex, nowMonthIndex } from '@/utils/format'
import type {
  Resume,
  ResumeConfigEntry,
  ResumeEducation,
  ResumeJob,
  ResumeLanguage,
} from '@/types/resume'
import resumeJson from '@/assets/data/resume.json'

export interface StackRef {
  name: string
  color: string | null
}

export interface JobRow {
  job: ResumeJob
  current: boolean
  period: string
  span: string
  stack: StackRef[]
}

export interface EducationRow {
  entry: ResumeEducation
  tag: string
}

export interface SkillGroupRow {
  group: string
  items: StackRef[]
}

export interface ScaleSegment {
  id: string
  label: string
  period: string
  span: string
  left: number
  width: number
  current: boolean
}

export interface ScaleTick {
  key: string
  label: string
  left: number
  labelled: boolean
}

export interface CareerScale {
  segments: ScaleSegment[]
  ticks: ScaleTick[]
}

const TICK_LABEL_STEP = 4

const jobRange = (job: ResumeJob): [number, number] => [
  monthIndex(job.start),
  job.end ? monthIndex(job.end) : nowMonthIndex(),
]

const totalMonths = (jobs: readonly ResumeJob[]): number => {
  const ranges = jobs.map(jobRange).sort((a, b) => a[0] - b[0])
  let total = 0
  let covered = -1

  for (const [from, to] of ranges) {
    const start = covered < 0 ? from : Math.max(from, covered + 1)
    if (to >= start) total += to - start + 1
    covered = Math.max(covered, to)
  }

  return total
}

const buildScale = (rows: readonly JobRow[]): CareerScale => {
  const ranges = rows
    .map((row) => [row, jobRange(row.job)] as const)
    .sort((a, b) => a[1][0] - b[1][0])
  const first = ranges[0]
  const last = ranges[ranges.length - 1]
  if (!first || !last) return { segments: [], ticks: [] }

  const from = first[1][0]
  const to = last[1][1]
  const total = to - from + 1
  const share = (months: number): number => (months / total) * 100

  const segments = ranges.map(([row, [start, end]]) => ({
    id: row.job.id,
    label: row.job.branch.replace('job/', ''),
    period: row.period,
    span: row.span,
    left: share(start - from),
    width: share(end - start + 1),
    current: row.current,
  }))

  const firstYear = Math.floor(from / 12)
  const lastYear = Math.floor(to / 12)
  const ticks: ScaleTick[] = []
  for (let year = firstYear; year <= lastYear; year += 1) {
    const labelled = (year - firstYear) % TICK_LABEL_STEP === 0
    ticks.push({
      key: String(year),
      label: labelled ? String(year) : '',
      left: Math.min(100, Math.max(0, share(year * 12 - from))),
      labelled,
    })
  }
  ticks.push({ key: 'now', label: 'сейчас', left: 100, labelled: true })

  return { segments, ticks }
}

export function useResume(): {
  jobs: ComputedRef<JobRow[]>
  totalSpan: ComputedRef<string>
  scale: ComputedRef<CareerScale>
  education: ComputedRef<EducationRow[]>
  skills: ComputedRef<SkillGroupRow[]>
  languages: readonly ResumeLanguage[]
  about: readonly string[]
  config: readonly ResumeConfigEntry[]
} {
  const resume = resumeJson as Resume

  const jobs = computed<JobRow[]>(() =>
    resume.jobs.map((job) => {
      const [from, to] = jobRange(job)
      return {
        job,
        current: !job.end,
        period: `${fmtMonthYear(job.start)} – ${job.end ? fmtMonthYear(job.end) : 'сейчас'}`,
        span: fmtSpan(to - from + 1),
        stack: job.stack.map((name) => ({ name, color: LANG_COLORS[name] ?? null })),
      }
    }),
  )

  const totalSpan = computed(() => fmtSpan(totalMonths(resume.jobs)))

  const education = computed<EducationRow[]>(() =>
    resume.education.map((entry) => ({ entry, tag: `v${entry.year}` })),
  )

  const scale = computed<CareerScale>(() => buildScale(jobs.value))

  const skills = computed<SkillGroupRow[]>(() =>
    resume.skills.map((group) => ({
      group: group.group,
      items: group.items.map((name) => ({ name, color: LANG_COLORS[name] ?? null })),
    })),
  )

  return {
    jobs,
    totalSpan,
    scale,
    education,
    skills,
    languages: resume.languages,
    about: resume.about,
    config: resume.config,
  }
}
