export const urls = {
  server: "/server/",
  client: "/app/",
  snappy: "/snappy/",
};

export const encode = (...path: string[]): string => {
  return path.map(p => encodeURIComponent(p)).join("/")
};
