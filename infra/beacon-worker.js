// Loema funnel beacon — a Cloudflare Worker.
//
// Counts which pages of the flow get reached. Nothing else.
// No cookies, no IP storage, no identifiers, no user words — the only stored
// datum is a step name and the fact that it was reached once by someone.
//
// Deploy (one time, ~5 minutes):
//   1. Cloudflare dashboard → Workers & Pages → Create Worker → paste this file.
//   2. In the Worker's Settings → Bindings, add an Analytics Engine dataset
//      binding named FUNNEL (dataset name: loema_funnel).
//   3. Add a route: loema.com/api/beacon* → this Worker (zone: loema.com).
//      The site itself stays on GitHub Pages; only /api/beacon is intercepted.
//   4. In index.html, set BEACON_ENDPOINT='/api/beacon'.
//
// Read the counts anytime in dashboard → Analytics Engine, e.g.:
//   SELECT blob1 AS step, SUM(_sample_interval) AS reached
//   FROM loema_funnel GROUP BY step
//
// Steps sent by the site: landing, questions, mirror, constitution,
// witnessed, steps, waitlist.

const KNOWN = new Set(['landing','questions','mirror','constitution','witnessed','steps','waitlist']);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/beacon') {
      const step = (url.searchParams.get('s') || '').slice(0, 24);
      if (KNOWN.has(step) && env.FUNNEL) {
        env.FUNNEL.writeDataPoint({ blobs: [step], doubles: [1], indexes: [step] });
      }
      // 204: nothing to say back, deliberately.
      return new Response(null, { status: 204 });
    }
    // Anything else on the route passes through untouched.
    return fetch(request);
  }
};
