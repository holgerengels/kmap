export const urls = {
  server: "/server/",
  client: "/app/",
  snappy: "/snappy/",
};

export const encodePath = (...path: string[]): string => path.map(p => encodeURIComponent(p)).join("/");

export const encodeParams = (m: { [name: string]: string }): string => Object.entries(m).map(e => e[0] + "=" + encodeURIComponent(e[1])).join("&");
