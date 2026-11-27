
export async function onRequestGet({ request }) {
  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get("url");

  const jsonResponse = (data, status = 200) =>
    Response.json(data, {
      status,
      headers: {
        "Cache-Control": "public, max-age=86400"
      }
    });

  if (!target) {
    return jsonResponse({ image: null, error: "Missing URL" }, 400);
  }

  try {
    const parsed = new URL(target);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return jsonResponse({ image: null }, 400);
    }

    const allowedHosts = [
      "instagram.com",
      "x.com",
      "twitter.com",
      "tiktok.com",
      "naver.com"
    ];

    const hostname = parsed.hostname.toLowerCase();

    const allowed = allowedHosts.some(host =>
      hostname === host || hostname.endsWith("." + host)
    );

    if (!allowed) {
      return jsonResponse({ image: null, error: "Unsupported platform" }, 400);
    }

    // Use the real Pages Function request as the cache key.
    const cache = caches.default;
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    const apiUrl = new URL(
      "https://api.linkmetadata.com/v1/metadata"
    );

    apiUrl.searchParams.set("url", parsed.href);
    apiUrl.searchParams.set("prefer", "og");

    const response = await fetch(apiUrl.toString());

    if (!response.ok) {
      return jsonResponse({
        image: null,
        error: "Metadata service error",
        status: response.status
      }, 502);
    }

    const result = await response.json();
    const image = result?.image?.url || null;

    const output = jsonResponse({ image });

    await cache.put(request, output.clone());

    return output;

  } catch (error) {
    return jsonResponse({
      image: null,
      error: error.message
    }, 500);
  }
}
