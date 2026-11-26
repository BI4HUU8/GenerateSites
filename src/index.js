export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Обробка запитів до бази даних
    if (url.pathname === "/api/products") {
      if (request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM products ORDER BY id DESC").all();
        return Response.json(results);
      }
      if (request.method === "POST") {
        const { name, price } = await request.json();
        await env.DB.prepare("INSERT INTO products (name, price) VALUES (?, ?)").bind(name, price).run();
        return Response.json({ success: true });
      }
      if (request.method === "PUT") {
        const { id, name, price } = await request.json();
        await env.DB.prepare("UPDATE products SET name = ?, price = ? WHERE id = ?").bind(name, price, id).run();
        return Response.json({ success: true });
      }
      if (request.method === "DELETE") {
        const id = url.searchParams.get("id");
        await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
        return Response.json({ success: true });
      }
    }

    // Віддача файлу base.html та інших статичних файлів
    return env.ASSETS.fetch(request);
  }
};
