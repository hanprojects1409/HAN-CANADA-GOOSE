
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const target = url.searchParams.get("url");

  if (!target) {
    return Response.json({ error: "Missing URL" });
  }

  try {
    const parsed = new URL(target);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return Response.json({ error: "Invalid URL" });
    }

    const apiUrl = new URL("https://api.microlink.io");
    apiUrl.searchParams.set("url", parsed.href);

    const response = await fetch(apiUrl.toString());
    const result = await response.json();

    return Response.json({
      status: result.status,
      image: result.data?.image?.url || null,
      code: result.code || null,
      message: result.message || null
    });

  } catch (error) {
    return Response.json({
      error: error.message
    });
  }
}
