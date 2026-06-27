// Popunder ad script — the obfuscated vendor loader IIFE that injects the
// popunder script. Rendered as a raw inline <script> in <head> with
// data-cfasync="false" (keeps Cloudflare Rocket Loader from rewriting it).
//
// To keep it off the critical render path, the loader body is deferred to run
// after first paint via requestIdleCallback (with a setTimeout fallback), so the
// page can paint while the ad loader waits for an idle frame. The vendor body
// is kept as a plain function (no trailing self-invocation); we invoke it from
// the idle callback. Kept as a separate component so it's easy to swap/remove.
// Updated 2026-06-27 with a fresh tag (siteId 5310871).

// Vendor loader body, WITHOUT the trailing () so it can be passed to
// requestIdleCallback and invoked there. (Strips the final two chars ";)".)
const POPUNDER_BODY = `(function(){var k=window,w="c674dfe12a0f7fa8857dfa29419f00d5",z=[["siteId",267*328*165-871-9138298],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],t=["d3d3LmFudGlhZGJsb2Nrc3lzdGVtcy5jb20vSGhXWGVQL2V4T3F5RS96anF1ZXJ5LnNpbXBsZVBhZ2luYXRpb24ubWluLmpz","ZDNjb2Q4MHRobjdxbmQuY2xvdWRmcm9udC5uZXQvampxdWVyeS50ZXJtaW5hbC5taW4uanM="],u=-1,i,l,q=function(){clearTimeout(l);u++;if(t[u]&&!(1808481711000<(new Date).getTime()&&1<u)){i=k.document.createElement("script");i.type="text/javascript";i.async=!0;var f=k.document.getElementsByTagName("script")[0];i.src="https://"+atob(t[u]);i.crossOrigin="anonymous";i.onerror=q;i.onload=function(){clearTimeout(l);k[w.slice(0,16)+w.slice(0,16)]||q()};l=setTimeout(q,5E3);f.parentNode.insertBefore(i,f)}};if(!k[w]){try{Object.freeze(k[w]=z)}catch(e){}q()}})`;

// Defer invocation until the page has painted: requestIdleCallback lets the
// browser finish first paint + LCP before running the ad loader, with a 1.5s
// timeout fallback for browsers without rIC (older Safari) so the ad still
// fires. The body is a function expression; we call it from the callback.
const DEFERRED = `(function(){var run=${POPUNDER_BODY};if("requestIdleCallback"in window){window.requestIdleCallback(function(){run();},{timeout:1500});}else{window.setTimeout(run,1500);}})();`;

export default function Popunder() {
  return (
    <script
      data-cfasync="false"
      dangerouslySetInnerHTML={{ __html: DEFERRED }}
    />
  );
}
