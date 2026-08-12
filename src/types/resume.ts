export interface ResumeConfigEntry {
  key: string
  value: string
}

export interface ResumeJob {
  id: string
  branch: string
  company: string
  role: string
  start: string
  end: string | null
  product: string
  summary: readonly string[]
  details: readonly string[]
  stack: readonly string[]
}

export interface ResumeEducation {
  year: number
  degree: string
  org: string
  faculty: string
  field: string
}

export interface ResumeSkillGroup {
  group: string
  items: readonly string[]
}

export interface ResumeLanguage {
  name: string
  level: string
}

export interface Resume {
  config: readonly ResumeConfigEntry[]
  jobs: readonly ResumeJob[]
  education: readonly ResumeEducation[]
  skills: readonly ResumeSkillGroup[]
  languages: readonly ResumeLanguage[]
  about: readonly string[]
}
