declare global {
  interface CloudflareEnv {
    URL_SHORTENER: KVNamespace;
    FEEDBACK_DB: D1Database;
  }
}

export {};
