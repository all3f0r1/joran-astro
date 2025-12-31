import type { APIContext } from 'astro';

export async function get({ locals }: APIContext) {
  const runtime = locals.runtime;
  if (!runtime) {
    return new Response(JSON.stringify({ error: 'Runtime not available' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
  const db = runtime.env.DB;

  try {
    const { results } = await db.prepare(
      'SELECT DISTINCT cidery FROM products ORDER BY cidery'
    ).all();
    
    return new Response(JSON.stringify(results), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Failed to fetch cideries' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
