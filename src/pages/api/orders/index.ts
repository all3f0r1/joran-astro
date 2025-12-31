import type { APIContext } from 'astro';

export async function post({ request, locals }: APIContext) {
  const runtime = locals.runtime;
  if (!runtime) {
    return new Response(JSON.stringify({ error: 'Runtime not available' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
  const db = runtime.env.DB;

  try {
    const data = await request.json();
    const { customer_name, customer_email, customer_phone, delivery_address, delivery_method, items, notes } = data;

    // Calculate total
    let total = 0;
    for (const item of items) {
      const product: { price: number } | null = await db.prepare('SELECT price FROM products WHERE id = ?')
        .bind(item.product_id)
        .first();
      
      if (product) {
        total += product.price * item.quantity;
      }
    }

    // Insert order
    const orderResult = await db.prepare(
      'INSERT INTO orders (customer_name, customer_email, customer_phone, delivery_address, delivery_method, total_amount, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(customer_name, customer_email, customer_phone || null, delivery_address || null, delivery_method, total, notes || null).run();
    
    const orderId = orderResult.meta.last_row_id;

    // Insert order items
    for (const item of items) {
      const product: { price: number } | null = await db.prepare('SELECT price FROM products WHERE id = ?')
        .bind(item.product_id)
        .first();
      
      if (product) {
        await db.prepare(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)'
        ).bind(orderId, item.product_id, item.quantity, product.price).run();
      }
    }

    return new Response(JSON.stringify({ success: true, order_id: orderId, total }), {
      headers: { 'content-type': 'application/json' },
    });

  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Failed to create order' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
