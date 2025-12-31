import type { APIContext } from 'astro';

export async function get({ params, locals }: APIContext) {
  const { id } = params;
  
  const runtime = locals.runtime;
  if (!runtime) {
    return new Response(JSON.stringify({ error: 'Runtime not available' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
  const db = runtime.env.DB;

  try {
    const product = await db.prepare('SELECT * FROM products WHERE id = ?')
      .bind(id)
      .first();
    
    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
    }
    
    return new Response(JSON.stringify(product), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Failed to fetch product' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
