export function getAppVersion(): string {
  return (
    process.env.APP_VERSION ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.RENDER_GIT_COMMIT ||
    process.env.SOURCE_COMMIT ||
    process.env.HEROKU_SLUG_COMMIT ||
    process.env.npm_package_version ||
    "dev"
  );
}
