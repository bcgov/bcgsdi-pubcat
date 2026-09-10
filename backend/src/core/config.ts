import dotenv from "dotenv";
import config from "nconf";

dotenv.config();

// Search path must include the application schema and "public" (for objects related to the PostGIS extension)
const encodedDbUrlOptions = encodeURIComponent(
  `-csearch_path=${process.env.DB_SCHEMA},public`,
);

const DB_URL = `postgresql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD || "")}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?options=${encodedDbUrlOptions}`;
const DB_URL_OBFUSCATED_PASSWORD = `postgresql://${process.env.DB_USER}:*******@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?options=${encodedDbUrlOptions}`;

config.defaults({
  environment: process.env.ENVIRONMENT || "local",
  server: {
    port: process.env.PORT,
  },
  db: {
    url: DB_URL,
    urlObfuscatedPassword: DB_URL_OBFUSCATED_PASSWORD,
    schema: process.env.DB_SCHEMA,
  },
});

config.required(["environment", "server:port", "db:url"]);

export { config };
