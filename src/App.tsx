import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { BlogCard } from './components/BlogCard';
import { BlogEditor } from './components/BlogEditor';
import { useBlogs } from './hooks/useBlogs';
import { PlusCircle, Database } from 'lucide-react';
import type { Blog } from './types';

function App() {
  const { blogs, addBlog, updateBlog, deleteBlog } = useBlogs();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);

  const handleOpenEditor = (blog?: Blog) => {
    if (blog) {
      setEditingBlog(blog);
    } else {
      setEditingBlog(null);
    }
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingBlog(null);
  };

  const handleSaveBlog = (blogData: Omit<Blog, 'id' | 'createdAt'>) => {
    if (editingBlog) {
      updateBlog(editingBlog.id, blogData);
    } else {
      addBlog(blogData);
    }
  };

  return (
    <>
      <Navbar />
      
      <main className="container mt-8 pb-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Your Blogs</h1>
            <p className="text-dim">Manage all your generated content in one place.</p>
          </div>
          <button className="btn btn-primary" onClick={() => handleOpenEditor()}>
            <PlusCircle size={20} /> Create New Blog
          </button>
        </div>

        {blogs.length === 0 ? (
          <div className="empty-state">
            <Database size={48} className="text-dim mx-auto mb-4" style={{ margin: '0 auto 16px auto', display: 'block' }} />
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No blogs found</h3>
            <p className="text-dim mb-4">You haven't created any blogs yet. Start by generating one with AI!</p>
            <button className="btn btn-primary" onClick={() => handleOpenEditor()}>
              <PlusCircle size={20} /> Create Your First Blog
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {blogs.map(blog => (
              <BlogCard 
                key={blog.id} 
                blog={blog} 
                onEdit={handleOpenEditor} 
                onDelete={deleteBlog} 
              />
            ))}
          </div>
        )}
      </main>

      {isEditorOpen && (
        <BlogEditor 
          initialData={editingBlog} 
          onSave={handleSaveBlog} 
          onClose={handleCloseEditor} 
        />
      )}
    </>
  );
}

export default App;
