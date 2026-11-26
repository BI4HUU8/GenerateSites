export async function onRequest(context) {
  const { request, env } = context;
  const db = env.DB; // Назва змінної, яку ми прив'яжемо в налаштуваннях

  // 1. Отримати всі товари (GET)
  if (request.method === "GET") {
    const { results } = await db.prepare("SELECT * FROM products ORDER BY id DESC").all();
    return Response.json(results);
  }

  // 2. Додати товар (POST)
  if (request.method === "POST") {
    const { name, price } = await request.json();
    await db.prepare("INSERT INTO products (name, price) VALUES (?, ?)").bind(name, price).run();
    return Response.json({ success: true });
  }

  // 3. Редагувати товар (PUT)
  if (request.method === "PUT") {
    const { id, name, price } = await request.json();
    await db.prepare("UPDATE products SET name = ?, price = ? WHERE id = ?").bind(name, price, id).run();
    return Response.json({ success: true });
  }

  // 4. Видалити товар (DELETE)
  if (request.method === "DELETE") {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    await db.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
    return Response.json({ success: true });
  }

  return new Response("Method not allowed", { status: 405 });
}
