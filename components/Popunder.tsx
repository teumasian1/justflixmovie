// Popunder ad script — the obfuscated vendor loader IIFE that injects the
// popunder script. Rendered as a raw inline <script> in <head> so it runs on
// load and carries data-cfasync="false" (keeps Cloudflare Rocket Loader from
// rewriting it). Kept as a separate component so it's easy to swap/remove.
// Updated 2026-06-24 with a fresh tag (siteId 5202081; the previous one had a
// corrupted payload URL and a dead CloudFront host, so no ad ever fired).

const POPUNDER_SRC = `(function(){var z=window,l="c6634ba9c225d071a868105e5fda7cc8",i=[["siteId",542*621-80-156+4865735],["minBid",0],["popundersPerIP","0"],["delayBetween",0],["default",false],["defaultPerDay",0],["topmostLayer","auto"]],r=["d3d3LmFudGlhZGJsb2Nrc3lzdGVtcy5jb20vempxdWVyeS5zaW1wbGVQYWdpbmF0aW9uLm1pbi5jc3M=","ZDNjb2Q4MHRobjdxbmQuY2xvdWRmcm9udC5uZXQvRW5Lc1Uvc2pxdWVyeS50ZXJtaW5hbC5taW4uanM="],x=-1,q,n,h=function(){clearTimeout(n);x++;if(r[x]&&!(1808198160000<(new Date).getTime()&&1<x)){q=z.document.createElement("script");q.type="text/javascript";q.async=!0;var u=z.document.getElementsByTagName("script")[0];q.src="https://"+atob(r[x]);q.crossOrigin="anonymous";q.onerror=h;q.onload=function(){clearTimeout(n);z[l.slice(0,16)+l.slice(0,16)]||h()};n=setTimeout(h,5E3);u.parentNode.insertBefore(q,u)}};if(!z[l]){try{Object.freeze(z[l]=i)}catch(e){}h()}})();`;

export default function Popunder() {
  return (
    <script
      data-cfasync="false"
      dangerouslySetInnerHTML={{ __html: POPUNDER_SRC }}
    />
  );
}
