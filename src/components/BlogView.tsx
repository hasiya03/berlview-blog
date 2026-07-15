import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Calendar, Loader2 } from 'lucide-react';
import type { Blog } from '../types';

interface BlogViewProps {
  blog: Blog;
  onClose: () => void;
}

export function BlogView({ blog, onClose }: BlogViewProps) {
  const [markdownText, setMarkdownText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchMarkdown() {
      if (!blog.markdownUrl) {
        setMarkdownText('# Content not found\nThis blog does not have any markdown content associated with it.');
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await fetch(blog.markdownUrl);
        if (!response.ok) throw new Error('Failed to fetch markdown');
        const text = await response.text();
        setMarkdownText(text);
      } catch (error) {
        console.error("Error fetching markdown:", error);
        setMarkdownText('# Error loading content\nFailed to load the blog content. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchMarkdown();
  }, [blog.markdownUrl]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" style={{ background: 'var(--bg)', alignItems: 'flex-start', overflowY: 'auto' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '40px auto', background: 'transparent', boxShadow: 'none' }}>
        
        <button 
          onClick={onClose} 
          className="btn" 
          style={{ marginBottom: '24px', display: 'inline-flex', gap: '8px', padding: '8px 16px', background: 'var(--bg-secondary)', borderRadius: '24px' }}
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        {blog.coverImage && (
          <img 
            src={blog.coverImage} 
            alt={blog.title} 
            style={{ width: '100%', height: '400px', objectFit: 'cover', borderRadius: '16px', marginBottom: '32px' }} 
          />
        )}

        <div className="blog-view-header" style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '16px', lineHeight: 1.2 }}>{blog.title}</h1>
          <div className="text-dim flex items-center gap-2 mb-4">
            <Calendar size={16} />
            <span>{new Date(blog.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          
          {blog.tags && blog.tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {blog.tags.map(tag => (
                <span key={tag} style={{ 
                  background: 'var(--accent)', color: 'white', 
                  padding: '4px 12px', borderRadius: '16px', fontSize: '0.85rem'
                }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="blog-view-content" style={{ minHeight: '400px', paddingBottom: '80px' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full text-dim">
              <Loader2 className="spin" size={32} />
              <span className="ml-3">Loading content...</span>
            </div>
          ) : (
            <article className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdownText}
              </ReactMarkdown>
            </article>
          )}
        </div>
      </div>
      
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
