export interface IndexItem {
  title: string
  subtitle: string
  url: string
  section: string
}

export interface FrontMatterData {
  title: string
}

export interface FileContent {
  /** The front matter data */
  data: FrontMatterData

  content: string
}
