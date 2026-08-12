export async function onRequest(context) {
  const urlParams = new URL(context.request.url).searchParams;
  const targetUrl = urlParams.get("url");

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
      }
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch target URL" }), { 
        status: res.status,
        headers: { "Content-Type": "application/json" }
      });
    }

    let title = "";
    let description = "";

    const rewriter = new HTMLRewriter()
      .on("title", {
        text(text) {
          title += text.text;
        }
      })
      .on('meta[property="og:title"]', {
        element(e) {
          const content = e.getAttribute("content");
          if (content) title = content; // og:title takes precedence
        }
      })
      .on('meta[name="description"]', {
        element(e) {
          const content = e.getAttribute("content");
          if (content && !description) description = content;
        }
      })
      .on('meta[property="og:description"]', {
        element(e) {
          const content = e.getAttribute("content");
          if (content) description = content; // og:description takes precedence
        }
      });

    // Pass the response through the rewriter to execute the handlers
    await rewriter.transform(res).arrayBuffer();

    return new Response(JSON.stringify({
      title: title.trim(),
      description: description.trim()
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600" // Cache results for an hour
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
