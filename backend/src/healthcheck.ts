import http from "node:http";
import { config } from "./core/config.js";

const request = http.get(
  `http://localhost:${config.get("server:port")}/api/health`,
  { timeout: 2000 },
  (response) => {
    response.resume();
    process.exit(response.statusCode === 200 ? 0 : 1);
  },
);

request.on("error", () => process.exit(1));

request.on("timeout", () => {
  request.destroy();
  process.exit(1);
});
