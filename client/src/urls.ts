export const urls = {
  server: "/server/",
  client: "/app/",
};

export const encode = (...path: string[]): string => {
  return path.map(p => encodeURIComponent(p)).join("/")
};
