// Where to go after signing in or registering, taken from "?redirect=" in the address (the invitation page uses it to send
// someone back to the invitation after they sign in). Only paths inside this site are accepted, so the link cannot be used
// to send people to another website.
export const readRedirect = (): string | null => {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("redirect");
  return value && value.startsWith("/") && !value.startsWith("//") ? value : null;
};

/** `path`, carrying the redirect along when there is one. */
export const withRedirect = (path: string, redirect: string | null): string =>
  redirect ? `${path}?redirect=${encodeURIComponent(redirect)}` : path;
