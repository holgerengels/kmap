export const urls = {
  server: "http://127.0.0.1:8081/server/",
  client: "http://127.0.0.1:8080/app/",
};

export const encode = (...path: string[]): string => {
  return path.map(p => encodeURIComponent(p)).join("/")
};
