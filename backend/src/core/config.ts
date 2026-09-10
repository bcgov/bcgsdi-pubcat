import dotenv from 'dotenv'
import config from 'nconf'

dotenv.config()

// Search path must include the application schema and "public" (for objects related to the PostGIS extension)
const encodedDbUrlOptions = encodeURIComponent(`-csearch_path=${process.env.DB_SCHEMA},public`)

const DB_URL = `postgresql://${process.env.DB_USER}:${encodeURIComponent(process.env.DB_PASSWORD || '')}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?options=${encodedDbUrlOptions}`
const DB_URL_OBFUSCATED_PASSWORD = `postgresql://${process.env.DB_USER}:*******@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?options=${encodedDbUrlOptions}`

config.defaults({
  environment: process.env.ENVIRONMENT || 'local',
  server: {
    port: process.env.PORT,
  },
  session: {
    secret: process.env.SESSION_SECRET,
    cookieName: process.env.SESSION_COOKIE_NAME || 'pubcat.sid',
    maxAgeMs: Number(process.env.SESSION_MAX_AGE_MS || 3600000),
    //any post-login or post-logout redirect uri will be checked against the allowed hosts.
    allowedHosts: process.env.ALLOWED_HOSTS?.split(',').map((v) => v.trim()) || [],
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  oidc: {
    issuerUrl: process.env.OIDC_ISSUER_URL,
    clientId: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    redirectUri: process.env.OIDC_REDIRECT_URI,
    scope: process.env.OIDC_SCOPE || 'openid profile email',
    identityProvider: process.env.IDENTIFY_PROVIDER || 'azureidir',
  },
  db: {
    url: DB_URL,
    urlObfuscatedPassword: DB_URL_OBFUSCATED_PASSWORD,
    schema: process.env.DB_SCHEMA,
  },
  s3: {
    bucket: process.env.ATTACHMENTS_S3_BUCKET_NAME,
    region: process.env.AWS_REGION || 'ca-central-1',
    // Optional: set S3_ENDPOINT to use a custom S3-compatible service (e.g. MinIO).
    endpoint: process.env.ATTACHMENTS_S3_ENDPOINT,
    // AWS credentials.  Required when not running on an IAM-role-enabled
    // host (e.g. local development or MinIO).
    accessKeyId: process.env.ATTACHMENTS_S3_BUCKET_ACCESS_KEY_ID,
    accessKeySecret: process.env.ATTACHMENTS_S3_BUCKET_ACCESS_KEY_SECRET,
  },
})

config.required([
  'environment',
  'server:port',
  'session:secret',
  'redis:url',
  'oidc:issuerUrl',
  'oidc:clientId',
  'oidc:clientSecret',
  //'oidc:redirectUri',
  //'oidc:postLogoutRedirectUri',
  'oidc:identityProvider',
  'db:url',
  's3:bucket',
])

export { config }
