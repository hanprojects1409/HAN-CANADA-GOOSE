
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

    const hostname = parsed.hostname.toLowerCase();

    const allowedHosts = [
      "instagram.com",
      "www.instagram.com",
      "x.com",
      "www.x.com",
      "twitter.com",
      "www.twitter.com",
      "tiktok.com",
      "www.tiktok.com",
      "naver.com",
      "www.naver.com",
      "m.naver.com"
    ];

    const allowed = allowedHosts.some(host =>
      hostname === host || hostname.endsWith("." + host)
    );

    if (!allowed) {
      return jsonResponse({ image: null }, 400);
    }

    const cacheKey = new Request(
      "https://preview-cache.local/" +
      encodeURIComponent(parsed.href)
    );

    const cache = caches.default;

    const cached = await cache.match(cacheKey);

    if (cached) {
      return cached;
    }

    const apiUrl = new URL(
      "https://api.linkmetadata.com/v1/metadata"
    );

    apiUrl.searchParams.set("url", parsed.href);
    apiUrl.searchParams.set("prefer", "og");

    const response = await fetch(apiUrl.toString(), {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return jsonResponse({
        image: null,
        error: "Metadata service unavailable",
        status: response.status
      }, 502);
    }

    const result = await response.json();

    const image = result?.image?.url || null;

    const output = jsonResponse({ image });

    await cache.put(cacheKey, output.clone());

    return output;

  } catch (error) {
    return jsonResponse({
      image: null,
      error: "Preview request failed"
    }, 500);
  }
}
