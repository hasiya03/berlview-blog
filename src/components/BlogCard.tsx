import { Edit2, Trash2, Share2, Image as ImageIcon } from 'lucide-react';
import type { Blog } from '../types';

interface BlogCardProps {
  blog: Blog;
  onEdit: (blog: Blog) => void;
  onDelete: (id: string) => void;
}

export function BlogCard({ blog, onEdit, onDelete }: BlogCardProps) {
  const handleShare = async () => {
    const shareText = blog.markdownUrl ? blog.markdownUrl : `Check out this blog: ${blog.title}\n\n${blog.description}`;
    try {
      await navigator.clipboard.writeText(shareText);
      alert(blog.markdownUrl ? 'Direct Markdown file link copied to clipboard!' : 'Blog content copied to clipboard! Save the blog again to generate a direct file link.');
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="card flex-col" style={{ height: '100%' }}>
      {blog.coverImage ? (
        <img src={blog.coverImage} alt={blog.title} className="cover-image" />
      ) : (
        <div className="cover-image flex items-center justify-center bg-surface" style={{ background: 'var(--surface)' }}>
          <ImageIcon size={48} className="text-dim" style={{ opacity: 0.5 }} />
        </div>
      )}
      
      <div className="flex-col p-6 flex" style={{ padding: '24px', flexGrow: 1 }}>
        <h3 className="mb-2" style={{ fontSize: '1.25rem' }}>{blog.title}</h3>
        <p className="text-dim line-clamp-3 mb-4" style={{ flexGrow: 1 }}>
          {blog.description}
        </p>
        
        <div className="flex gap-2 mt-auto pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-secondary flex" style={{ flex: 1 }} onClick={(e) => { e.stopPropagation(); onEdit(blog); }}>
            <Edit2 size={16} /> Edit
          </button>
          <button className="btn btn-icon" onClick={(e) => { e.stopPropagation(); handleShare(); }} title="Copy Share Text">
            <Share2 size={18} />
          </button>
          <button className="btn btn-icon text-danger" onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Are you sure you want to delete this blog?')) {
              onDelete(blog.id);
            }
          }} title="Delete Blog">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
