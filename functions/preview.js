
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const target = url.searchParams.get("url");

  if (!target) {
    return Response.json({ image: null });
  }

  try {
    const parsed = new URL(target);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return Response.json({ image: null });
    }

    const apiUrl = new URL("https://api.microlink.io");
    apiUrl.searchParams.set("url", parsed.href);

    const response = await fetch(apiUrl.toString(), {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return Response.json({ image: null });
    }

    const result = await response.json();

    const image = result?.data?.image?.url || null;

    return Response.json(
      { image },
      {
        headers: {
          "Cache-Control": "public, max-age=3600"
        }
      }
    );

  } catch (error) {
    return Response.json({ image: null });
  }
}
