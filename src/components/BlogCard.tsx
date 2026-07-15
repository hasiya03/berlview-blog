import { Edit2, Trash2, Share2, Image as ImageIcon } from 'lucide-react';
import type { Blog } from '../types';

interface BlogCardProps {
  blog: Blog;
  onEdit: (blog: Blog) => void;
  onDelete: (id: string) => void;
  onToggleActive?: (id: string, currentStatus: boolean) => void;
}

export function BlogCard({ blog, onEdit, onDelete, onToggleActive }: BlogCardProps) {
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
        <div className="flex justify-between items-start mb-2">
          <h3 style={{ fontSize: '1.25rem', paddingRight: '12px' }}>{blog.title}</h3>
          {onToggleActive && (
            <div 
              className="flex items-center gap-2"
              onClick={(e) => { e.stopPropagation(); }}
            >
              <span className="text-dim" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                {blog.is_active ? 'Active' : 'Inactive'}
              </span>
              <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                <input 
                  type="checkbox" 
                  checked={blog.is_active ?? false} 
                  onChange={() => onToggleActive(blog.id, blog.is_active ?? false)} 
                  style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                />
                <div style={{
                  width: '40px', height: '22px', 
                  backgroundColor: blog.is_active ? 'var(--accent)' : 'var(--border)',
                  borderRadius: '11px', position: 'relative', transition: 'background-color 0.2s'
                }}>
                  <div style={{
                    width: '18px', height: '18px', backgroundColor: 'white', borderRadius: '50%',
                    position: 'absolute', top: '2px', 
                    left: blog.is_active ? '20px' : '2px', 
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </label>
            </div>
          )}
        </div>
        <p className="text-dim line-clamp-3 mb-4" style={{ flexGrow: 1 }}>
          {blog.description}
        </p>

        {blog.tags && blog.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {blog.tags.map(tag => (
              <span key={tag} style={{ 
                background: 'var(--bg-secondary)', color: 'var(--text)', 
                padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem',
                border: '1px solid var(--border)'
              }}>
                #{tag}
              </span>
            ))}
          </div>
        )}
        
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
