/**
 * Makes server-side fetch respect HTTPS_PROXY/NO_PROXY env vars (Node's
 * built-in fetch ignores them). No-op when no proxy is configured, e.g. on
 * Vercel — only kicks in for environments that route egress through a proxy.
 */
export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    (process.env.HTTPS_PROXY || process.env.https_proxy)
  ) {
    const { setGlobalDispatcher, EnvHttpProxyAgent } = await import("undici");
    setGlobalDispatcher(new EnvHttpProxyAgent());
  }
}
