
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

    const response = await fetch(parsed.href, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "text/html"
      },
      redirect: "follow"
    });

    if (!response.ok) {
      return Response.json({ image: null });
    }

    const html = await response.text();
    const tags = html.match(/<meta\b[^>]*>/gi) || [];

    function decodeEntities(value) {
      return value
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;|&apos;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">");
    }

    function getAttribute(tag, name) {
      const match = tag.match(
        new RegExp(
          name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))",
          "i"
        )
      );

      return match
        ? decodeEntities(match[1] || match[2] || match[3] || "")
        : null;
    }

    let image = null;

    for (const tag of tags) {
      const property =
        getAttribute(tag, "property") ||
        getAttribute(tag, "name");

      if (
        property &&
        ["og:image", "twitter:image"].includes(
          property.toLowerCase()
        )
      ) {
        image = getAttribute(tag, "content");
        if (image) break;
      }
    }

    if (image) {
      image = new URL(image, parsed.href).href;
    }

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
