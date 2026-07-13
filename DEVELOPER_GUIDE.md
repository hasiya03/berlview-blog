# Berl Blog - Developer Integration Guide

Welcome! This guide explains how to pull the blog data from the Berl Blog Admin Dashboard into your custom frontend website.

## Architecture Overview
The blog admin dashboard is connected to a headless **Supabase** backend. 
- The list of blogs (title, date, description, cover image URL) is stored in a PostgreSQL database.
- The actual full blog content is stored as physical `.md` files in a Supabase Storage Bucket.

## 1. Environment Setup
To connect to the database, you will need the following two environment variables. 
*(The admin will provide you with the actual values for these).*

```env
VITE_SUPABASE_URL="https://YOUR_PROJECT_ID.supabase.co"
VITE_SUPABASE_ANON_KEY="YOUR_ANON_KEY"
```

---

## 2. Fetching the Blog List (The Grid)
You do **not** need to download all the heavy `.md` files just to build the homepage grid! Supabase automatically provides a lightweight JSON API. 

To get the full list of all published blogs, you can simply make a standard `GET` request using the REST API. 

### Example Fetch (Vanilla JS)
```javascript
const SUPABASE_URL = process.env.VITE_SUPABASE_URL; // Or however your framework handles env vars
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function getBlogList() {
  // We use ?select= to only grab the lightweight fields we need, ordering by newest first.
  const response = await fetch(`${SUPABASE_URL}/rest/v1/blogs?select=id,title,coverImage,description,markdownUrl,created_at&order=created_at.desc`, {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  const blogs = await response.json();
  return blogs;
}
```

### JSON Response Format
The API will return an array of objects looking like this:
```json
[
  {
    "id": "uuid-string",
    "title": "Why APIs are Important",
    "description": "A long string describing the blog...",
    "coverImage": "https://[PROJECT_ID].supabase.co/storage/v1/object/public/blog-images/image1.jpg",
    "markdownUrl": "https://[PROJECT_ID].supabase.co/storage/v1/object/public/blog-images/blog-123.md",
    "created_at": "2026-07-12T15:30:00Z"
  }
]
```
*Tip: You can easily truncate the `description` string in your UI using Javascript (e.g., `blog.description.substring(0, 150) + '...'`).*

---

## 3. Fetching the Full Blog Content (.md file)
When a user clicks on a specific blog in your grid to read the full article, you simply grab the `markdownUrl` from that blog object and fetch it!

### Example Fetch
```javascript
async function getMarkdownContent(markdownUrl) {
  // Because the bucket is public, you don't even need API keys to fetch the .md file!
  const response = await fetch(markdownUrl);
  const markdownText = await response.text();
  
  return markdownText; // This is the raw Markdown string
}
```

Once you have the `markdownText`, you can parse it using any Markdown library (like `marked`, `react-markdown`, `mdsvex`, etc.) to render it into HTML on your page!
