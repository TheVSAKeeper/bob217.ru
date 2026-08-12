export type WorkKind = 'order' | 'hired' | 'fun'

export interface WorkLink {
  url: string
  label: string
}

export interface WorkEntry {
  id: number
  kind: WorkKind
  title: string
  tags: readonly string[]
  description: readonly string[]
  links?: readonly WorkLink[]
}
