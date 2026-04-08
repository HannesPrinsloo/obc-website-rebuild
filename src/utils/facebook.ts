import mockData from "../data/mock-facebook-feed.json";

export interface FacebookPost {
  id: string;
  message?: string;
  full_picture?: string;
  permalink_url: string;
}

export interface FacebookGraphResponse {
  data: FacebookPost[];
}

export async function getLatestFacebookPosts(): Promise<FacebookPost[]> {
  const useLiveApi = import.meta.env.USE_LIVE_FB_API === "true";

  if (!useLiveApi) {
    console.log("[Facebook API] Dev mode: loading mock posts.");
    await new Promise((resolve) => setTimeout(resolve, 300));
    return mockData.data;
  }

  const pageId = import.meta.env.FB_PAGE_ID;
  const accessToken = import.meta.env.FB_ACCESS_TOKEN;

  if (!pageId || !accessToken) {
    console.warn("[Facebook API] Missing .env credentials. Falling back to mock data.");
    return mockData.data;
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${pageId}/posts?fields=message,full_picture,permalink_url&limit=4&access_token=${accessToken}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Facebook API error: ${response.status} ${response.statusText}`);
    }
    const json = (await response.json()) as FacebookGraphResponse;
    return json.data;
  } catch (error) {
    console.error("[Facebook API] Fetch failed. Falling back to mock data.", error);
    return mockData.data;
  }
}
