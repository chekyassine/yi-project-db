export async function onRequest(context) {
  const urlParams = new URL(context.request.url).searchParams;
  const targetUrl = urlParams.get("url");

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "Missing url parameter" }), { 
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }

  let ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36";
  
  // Facebook strictly blocks regular browsers but allows its own crawler
  if (targetUrl.includes('facebook.com') || targetUrl.includes('fb.watch') || targetUrl.includes('fb.com')) {
    ua = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
  } else if (targetUrl.includes('x.com') || targetUrl.includes('twitter.com')) {
    ua = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
  }

  try {
    let title = "";
    let description = "";

    // 1. First attempt: Direct fetch and HTMLRewriter parsing
    try {
      const res = await fetch(targetUrl, {
        headers: {
          "User-Agent": ua,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5"
        }
      });

      if (res.ok) {
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

        await rewriter.transform(res).arrayBuffer();
      }
    } catch(e) {
      // Ignore direct fetch errors, we will try the fallback
    }

    // 2. Fallback: If title is empty, Cloudflare Worker IP was likely blocked (e.g. by Facebook/Instagram). 
    // Fall back to Microlink API to extract opengraph tags.
    if (!title || title.trim() === '') {
      try {
        const mlRes = await fetch('https://api.microlink.io/?url=' + encodeURIComponent(targetUrl));
        if (mlRes.ok) {
          const mlData = await mlRes.json();
          if (mlData.status === 'success' && mlData.data) {
            if (mlData.data.title) title = mlData.data.title;
            if (mlData.data.description) description = mlData.data.description;
          }
        }
      } catch (e) {
        // Ignore fallback errors
      }
    }

    return new Response(JSON.stringify({
      title: title ? title.trim() : "",
      description: description ? description.trim() : ""
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
