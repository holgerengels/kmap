export interface Path {
  subject: string,
  chapter: string,
  topic?: string,
}

export interface Upload {
  file: File,
  uploading: boolean;
}

export interface Attachment {
  name: string,
  tag: string,
  type: string,
  href?: string,
  file?: string,
  mime?: string,
}

export interface Card {
  subject: string,
  module: string,
  chapter: string,
  topic: string,
  row?: number,
  col?: number,
  keywords: string,
  summary: string,
  description: string,
  thumb?: string;
  links?: string,
  depends?: string[],
  priority?: number,
  attachments: Attachment[];
  annotations?: string,
  created?: number,
  modified?: number,
  author?: string,
}
