
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
        "User-Agent": "Mozilla/5.0 (compatible; PreviewBot/1.0)",
        "Accept": "text/html"
      },
      redirect: "follow"
    });

    if (!response.ok) {
      return Response.json({ image: null });
    }

    const html = await response.text();

    const tags = html.match(/<meta\b[^>]*>/gi) || [];

    function getAttribute(tag, name) {
      const match = tag.match(
  new RegExp(
    name + "=[\"']([^\"']*)[\"']",
    "i"
  )
);

      return match ? match[1] : null;
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
