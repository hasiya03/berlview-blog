import React, { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import type { Blog } from '../types';
import { generateBlogDescription } from '../services/ai';
import { supabase } from '../services/supabase';

// Rich Text Editor dependencies
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import TurndownService from 'turndown';

interface BlogEditorProps {
  initialData?: Blog | null;
  onSave: (blog: Omit<Blog, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export function BlogEditor({ initialData, onSave, onClose }: BlogEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [shortDescription, setShortDescription] = useState(initialData?.description || '');
  
  // We need to fetch the markdown if editing, but for simplicity we assume 
  // 'initialData.markdownUrl' is handled externally. Since the old system used 'description' 
  // for the full markdown, if we're editing an old post, it might not have html.
  // For now, we start with empty content for new blogs.
  const [content, setContent] = useState('');
  
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [wordCount, setWordCount] = useState<number>(200);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Turndown service to convert HTML back to Markdown
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  // Quill modules configuration for the toolbar
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      ['clean']
    ]
  };

  useEffect(() => {
    // If we're editing an existing blog, we should fetch its markdown and convert to HTML, 
    // or just leave it blank for now. A robust implementation would parse the MD back to HTML.
    // For now, we'll focus on the new authoring flow.
    if (initialData?.markdownUrl) {
      setContent('<p><em>Existing content is stored in Markdown. Please edit from scratch or implement an MD to HTML parser.</em></p>');
    }
  }, [initialData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsGenerating(true); 
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX = 1000;
          
          if (width > height && width > MAX) {
            height = Math.round(height * (MAX / width));
            width = MAX;
          } else if (height > MAX) {
            width = Math.round(width * (MAX / height));
            height = MAX;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(async (blob) => {
            if (!blob) {
              setIsGenerating(false);
              return;
            }
            
            try {
              const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
              const { error } = await supabase.storage
                .from('blog-images')
                .upload(fileName, blob, {
                  contentType: 'image/jpeg',
                  upsert: false
                });
                
              if (error) throw error;
              
              const { data: { publicUrl } } = supabase.storage
                .from('blog-images')
                .getPublicUrl(fileName);
                
              setCoverImage(publicUrl);
            } catch (err) {
              console.error("Error uploading image:", err);
              alert("Failed to upload image to Supabase.");
            } finally {
              setIsGenerating(false);
            }
          }, 'image/jpeg', 0.7);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateAI = async () => {
    if (!title) {
      alert("Please enter a topic/title first to generate content.");
      return;
    }
    
    setIsGenerating(true);
    try {
      // We generate the content using AI, which might return raw text. 
      // We'll insert it into the quill editor.
      const generatedText = await generateBlogDescription(title, wordCount);
      // Auto-fill short description too
      if (!shortDescription) {
        setShortDescription(generatedText.substring(0, 150) + '...');
      }
      setContent(`<p>${generatedText.replace(/\\n/g, '<br/>')}</p>`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title) {
      alert("Please provide a title/topic.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const dateStr = new Date().toLocaleDateString();
      
      // Convert the rich text HTML to Markdown using Turndown
      const contentMarkdown = turndownService.turndown(content);
      
      // Combine it with the title and date
      const markdownDocument = `# ${title}\n\n*Published on ${dateStr}*\n\n${contentMarkdown}\n`;
      
      // Upload the markdown to Supabase Storage
      const blob = new Blob([markdownDocument], { type: 'text/markdown' });
      const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(7)}.md`;
      
      const { error } = await supabase.storage
        .from('blog-images') // Reusing the public bucket
        .upload(fileName, blob, {
          contentType: 'text/markdown',
          upsert: false
        });
        
      if (error) throw error;
      
      const { data: { publicUrl: markdownUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(fileName);
        
      // Auto-generate short description if empty
      const finalShortDesc = shortDescription.trim() 
        ? shortDescription 
        : contentMarkdown.replace(/[*#_]/g, '').substring(0, 150) + '...';
        
      // Save ONLY the short description to the database
      onSave({ 
        title, 
        description: finalShortDesc, 
        coverImage, 
        markdownUrl 
      });
      onClose();
    } catch (err) {
      console.error("Error generating markdown file:", err);
      alert("Failed to upload markdown file. Ensure your Supabase storage is configured correctly.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles className="text-accent" size={24} />
            {initialData ? 'Edit Blog' : 'Create New Blog'}
          </h2>
          <button className="btn-icon" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="modal-body">
          <div className="input-group">
            <label className="input-label">Cover Image</label>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleImageUpload}
            />
            {coverImage ? (
              <div style={{ position: 'relative' }}>
                <img src={coverImage} alt="Cover Preview" className="image-preview" />
                <button 
                  className="btn btn-secondary" 
                  style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.9)' }}
                  onClick={() => setCoverImage('')}
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="image-upload-area flex-col items-center justify-center gap-4" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={48} className="text-dim" />
                <p className="text-dim">Click to upload a cover image</p>
              </div>
            )}
          </div>

          <div className="input-group mt-4">
            <label className="input-label">Topic / Title</label>
            <input 
              type="text" 
              className="input" 
              placeholder="e.g. The Future of Sustainable Architecture"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="input-group mt-4">
            <label className="input-label">Short Summary (For Blog Card)</label>
            <input 
              type="text" 
              className="input" 
              placeholder="A short 1-2 sentence preview for the homepage..."
              value={shortDescription}
              onChange={e => setShortDescription(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="input-group mt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="input-label">Full Blog Content</label>
              <div className="flex items-center gap-2">
                <span className="text-dim" style={{ fontSize: '0.85rem' }}>AI Generate words:</span>
                <input 
                  type="number" 
                  className="input" 
                  style={{ width: '80px', padding: '6px 10px', fontSize: '0.9rem' }}
                  value={wordCount}
                  onChange={e => setWordCount(Number(e.target.value))}
                  min={50}
                  max={1000}
                />
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                  onClick={handleGenerateAI}
                  disabled={isGenerating || !title}
                >
                  {isGenerating ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
                  Auto-write
                </button>
              </div>
            </div>
            
            <div className="rich-text-container">
              <ReactQuill 
                theme="snow" 
                value={content} 
                onChange={setContent}
                modules={modules}
                placeholder="Write your amazing blog post here, or paste from Word..."
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" style={{ background: 'transparent', color: 'var(--text)' }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {initialData ? 'Save Changes' : 'Publish Blog'}
          </button>
        </div>
      </div>
      
      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
