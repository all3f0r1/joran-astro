import type { APIContext } from 'astro';

export async function get({ request, locals }: APIContext) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');
  const cidery = searchParams.get('cidery');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const search = searchParams.get('search');
  
  const runtime = locals.runtime;
  if (!runtime) {
    return new Response(JSON.stringify({ error: 'Runtime not available' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
  const db = runtime.env.DB;

  let query = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];

  if (country) {
    query += ' AND country = ?';
    params.push(country);
  }
  
  if (cidery) {
    query += ' AND cidery = ?';
    params.push(cidery);
  }
  
  if (minPrice) {
    query += ' AND price >= ?';
    params.push(parseFloat(minPrice));
  }
  
  if (maxPrice) {
    query += ' AND price <= ?';
    params.push(parseFloat(maxPrice));
  }
  
  if (search) {
    query += ' AND (name LIKE ? OR cidery LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }
  
  query += ' ORDER BY cidery, name';
  
  try {
    const { results } = await db.prepare(query).bind(...params).all();
    return new Response(JSON.stringify(results), {
      headers: { 'content-type': 'application/json' },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: 'Failed to fetch products' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
