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
  minorEdit?: boolean;
  subject: string,
  module: string,
  chapter: string,
  topic: string,
  row?: number,
  col?: number,
  keywords?: string,
  sgs?: string,
  educationalLevel?: string,
  educationalContext?: string,
  typicalAgeRange?: string,
  summary: string,
  description: string,
  thumb?: string;
  links?: string,
  depends?: string[],
  dependencies?: string[];
  priority?: number,
  attachments: Attachment[];
  skills: string[];
  annotations?: string,
  created?: number,
  modified?: number,
  author?: string,
}
