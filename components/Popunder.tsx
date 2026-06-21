// Popunder ad script, ported verbatim from the original index.html inline
// IIFE (the obfuscated loader that injects the popunder vendor's script).
// Rendered as a raw inline <script> in <head> — same as the original — so it
// runs on load and carries data-cfasync="false" (keeps Cloudflare Rocket Loader
// from rewriting it). Kept as a separate component so it's easy to remove.

const POPUNDER_SRC = `(function () { var v = window, h = "c6634ba9c225d071a868105e5fda7cc8", y = [["siteId", 491 - 310 - 538 + 873 + 5201565], ["minBid", 0], ["popundersPerIP", "0"], ["delayBetween", 0], ["default", false], ["defaultPerDay", 0], ["topmostLayer", "auto"]], f = ["d3d3LmFudGlhZGJsb2Nrc3lzdGVtcy5jb20vY2FtYXpldWkubWluLmNzcw==", "ZDNjb2Q8MHRobjdxbmQuY2xvdWRmcm9udC5uZXQvUXhTSFQvYXR3aXgubWluLmpz"], s = -1, a, j, n = function () { clearTimeout(j); s++; if (f[s] && !(1773925395000 < (new Date).getTime() && 1 < s)) { a = v.document.createElement("script"); a.type = "text/javascript"; a.async = !0; var b = v.document.getElementsByTagName("script")[0]; a.src = "https://" + atob(f[s]); a.crossOrigin = "anonymous"; a.onerror = n; a.onload = function () { clearTimeout(j); v[h.slice(0, 16) + h.slice(0, 16)] || n() }; j = setTimeout(n, 5E3); b.parentNode.insertBefore(a, b) } }; if (!v[h]) { try { Object.freeze(v[h] = y) } catch (e) { } n() } })();`;

export default function Popunder() {
  return (
    <script
      data-cfasync="false"
      dangerouslySetInnerHTML={{ __html: POPUNDER_SRC }}
    />
  );
}
