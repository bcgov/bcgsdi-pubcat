// BASE_URL is the deployment root (e.g. https://host); the API is served under /api.
const BASE_URL = (process.env.BASE_URL ?? "http://localhost:3001").replace(
  /\/+$/,
  "",
);

export async function search(body) {
  const response = await fetch(`${BASE_URL}/api/publications/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, body: json };
}

export const XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function download(body, accept = XLSX_TYPE) {
  const response = await fetch(`${BASE_URL}/api/publications/download`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: accept },
    body: JSON.stringify(body),
  });
  const bytes = Buffer.from(await response.arrayBuffer());
  return { status: response.status, headers: response.headers, bytes };
}
