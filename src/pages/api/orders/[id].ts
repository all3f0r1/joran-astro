import type { APIContext } from 'astro';

export async function get({ params, locals }: APIContext) {
  const { id } = params;

  const runtime = locals.runtime;
  if (!runtime) {
    return new Response(JSON.stringify({ error: 'Runtime not available' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
  const db = runtime.env.DB;

  try {
    const order = await db.prepare('SELECT * FROM orders WHERE id = ?')
      .bind(id)
      .first();
    
    if (!order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404, headers: { 'content-type': 'application/json' } });
    }
    
    const { results: items } = await db.prepare(`
      SELECT oi.*, p.name, p.cidery, p.country 
      FROM order_items oi 
      JOIN products p ON oi.product_id = p.id 
      WHERE oi.order_id = ?
    `).bind(id).all();
    
    return new Response(JSON.stringify({ ...order, items }), {
      headers: { 'content-type': 'application/json' },
    });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Failed to fetch order' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
