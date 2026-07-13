import { useState, useEffect } from 'react';
import type { Blog } from '../types';
import { supabase } from '../services/supabase';

export function useBlogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data) {
        // Map created_at to createdAt for frontend consistency
        const formattedData = data.map(blog => ({
          ...blog,
          createdAt: new Date(blog.created_at).getTime()
        }));
        setBlogs(formattedData);
      }
    } catch (error) {
      console.error('Error fetching blogs from Supabase:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if Supabase URL is somewhat valid
    if (import.meta.env.VITE_SUPABASE_URL) {
      fetchBlogs();
    } else {
      setIsLoading(false);
      console.warn("Supabase not configured, cannot fetch blogs.");
    }
  }, []);

  const addBlog = async (blog: Omit<Blog, 'id' | 'createdAt'>) => {
    try {
      // Optimistic update
      const tempId = crypto.randomUUID();
      const newBlog: Blog = {
        ...blog,
        id: tempId,
        createdAt: Date.now(),
      };
      setBlogs(prev => [newBlog, ...prev]);

      const { data, error } = await supabase
        .from('blogs')
        .insert([{
          title: blog.title,
          description: blog.description,
          coverImage: blog.coverImage,
          markdownUrl: blog.markdownUrl,
          is_active: blog.is_active ?? false
        }])
        .select()
        .single();

      if (error) throw error;

      // Update with actual DB ID and timestamp
      if (data) {
        setBlogs(prev => prev.map(b => b.id === tempId ? {
          ...b,
          id: data.id,
          createdAt: new Date(data.created_at).getTime()
        } : b));
      }
    } catch (error) {
      console.error('Error adding blog:', error);
      // Revert optimistic update
      fetchBlogs(); 
    }
  };

  const deleteFileFromStorage = async (fileUrl: string | null | undefined) => {
    if (!fileUrl) return;
    try {
      let bucket = '';
      if (fileUrl.includes('/blog-images/')) bucket = 'blog-images';
      else if (fileUrl.includes('/blog-md/')) bucket = 'blog-md';
      
      if (bucket) {
        const fileName = fileUrl.split(`/${bucket}/`).pop();
        if (fileName) {
          await supabase.storage.from(bucket).remove([fileName]);
        }
      }
    } catch (e) {
      console.error("Failed to delete old file from storage", e);
    }
  };

  const updateBlog = async (id: string, updates: Partial<Omit<Blog, 'id' | 'createdAt'>>) => {
    try {
      const oldBlog = blogs.find(b => b.id === id);
      
      // Optimistic update
      setBlogs(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));

      const { error } = await supabase
        .from('blogs')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      // If the image or markdown file changed, delete the old one to save space
      if (oldBlog) {
        if (updates.coverImage !== undefined && oldBlog.coverImage !== updates.coverImage) {
          deleteFileFromStorage(oldBlog.coverImage);
        }
        if (updates.markdownUrl !== undefined && oldBlog.markdownUrl !== updates.markdownUrl) {
          deleteFileFromStorage(oldBlog.markdownUrl);
        }
      }
    } catch (error) {
      console.error('Error updating blog:', error);
      fetchBlogs(); // Revert on error
    }
  };

  const deleteBlog = async (id: string) => {
    try {
      const oldBlog = blogs.find(b => b.id === id);
      
      // Optimistic update
      setBlogs(prev => prev.filter(b => b.id !== id));

      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Delete the associated files if they exist
      if (oldBlog) {
        deleteFileFromStorage(oldBlog.coverImage);
        deleteFileFromStorage(oldBlog.markdownUrl);
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      fetchBlogs(); // Revert on error
    }
  };

  return {
    blogs,
    isLoading,
    addBlog,
    updateBlog,
    deleteBlog,
    refreshBlogs: fetchBlogs
  };
}
