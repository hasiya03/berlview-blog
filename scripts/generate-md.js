import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const blogsDir = path.join(rootDir, 'public', 'blogs');

// Utility to create a URL-friendly slug
function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '_')           // Replace spaces with _
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '_')         // Replace multiple - with single _
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

async function syncBlogs() {
  console.log('Fetching blogs from Supabase...');
  
  const { data: blogs, error } = await supabase
    .from('blogs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching blogs:", error);
    process.exit(1);
  }

  console.log(`Found ${blogs.length} blogs. Syncing to local file system...`);

  // Ensure public/blogs directory exists
  if (!fs.existsSync(blogsDir)) {
    fs.mkdirSync(blogsDir, { recursive: true });
  }

  const blogsJsonData = { blogs: [] };

  for (const blog of blogs) {
    const slug = slugify(blog.title);
    const blogFolder = path.join(blogsDir, slug);
    
    // Create folder for the blog
    if (!fs.existsSync(blogFolder)) {
      fs.mkdirSync(blogFolder, { recursive: true });
    }

    // Prepare md content
    const mdContent = `---
title: ${blog.title}
date: ${new Date(blog.created_at).toISOString()}
coverImage: ${blog.coverImage || ''}
---

${blog.description}
`;
    
    // Write MD file
    fs.writeFileSync(path.join(blogFolder, 'blog.md'), mdContent);

    // Add to blogs.json array
    blogsJsonData.blogs.push({
      title: blog.title,
      "short description": blog.description.substring(0, 150) + '...',
      img: blog.coverImage || '',
      date: new Date(blog.created_at).toISOString(),
      imgalt: blog.title
    });
    
    console.log(`Synced: ${blog.title}`);
  }

  // Write root blogs.json
  fs.writeFileSync(
    path.join(blogsDir, 'blogs.json'), 
    JSON.stringify(blogsJsonData, null, 2)
  );

  console.log('\nSync complete! All blogs saved to public/blogs');
}

syncBlogs();
