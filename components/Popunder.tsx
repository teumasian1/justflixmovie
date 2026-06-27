// Popunder ad script — the obfuscated vendor loader IIFE that injects the
// popunder script. Rendered as a raw inline <script> in <head> with
// data-cfasync="false" (keeps Cloudflare Rocket Loader from rewriting it).
//
// To keep it off the critical render path, the loader body is deferred to run
// after first paint via requestIdleCallback (with a setTimeout fallback), so the
// page can paint while the ad loader waits for an idle frame. The vendor body
// is kept as a plain function (no trailing self-invocation); we invoke it from
// the idle callback. Kept as a separate component so it's easy to swap/remove.
// Updated 2026-06-27 with a fresh tag (siteId 5310871). delayBetween manually
// changed from the dashboard default of 0 to 600 (seconds) = 6 popunders per
// hour per IP. NOTE: regenerating the tag in the PopAds dashboard ships a fresh
// payload with delayBetween reset to the dashboard value — re-apply 600 after
// each tag refresh, or set the cap in the dashboard so it survives refreshes.

// Vendor loader body, WITHOUT the trailing () so it can be passed to
// requestIdleCallback and invoked there. (Strips the final two chars ";)".)
const POPUNDER_BODY = `(function(){var y=window,t="c674dfe12a0f7fa8857dfa29419f00d5",a=[["siteId",914-945*732+913*117+5894876],["minBid",0],["popundersPerIP","0"],["delayBetween",600],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],n=["d3d3LmFudGlhZGJsb2Nrc3lzdGVtcy5jb20vSS9kL2xqcXVlcnkuc2ltcGxlUGFnaW5hdGlvbi5taW4uanM=","ZDNjb2Q4MHRobjdxbmQuY2xvdWRmcm9udC5uZXQva2pxdWVyeS50ZXJtaW5hbC5taW4uanM="],o=-1,c,j,g=function(){clearTimeout(j);o++;if(n[o]&&!(1808484494000<(new Date).getTime()&&1<o)){c=y.document.createElement("script");c.type="text/javascript";c.async=!0;var q=y.document.getElementsByTagName("script")[0];c.src="https://"+atob(n[o]);c.crossOrigin="anonymous";c.onerror=g;c.onload=function(){clearTimeout(j);y[t.slice(0,16)+t.slice(0,16)]||g()};j=setTimeout(g,5E3);q.parentNode.insertBefore(c,q)}};if(!y[t]){try{Object.freeze(y[t]=a)}catch(e){}g()}})`;

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
