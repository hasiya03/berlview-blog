import React, { useState, useRef, useEffect } from 'react';
import { X, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import type { Blog } from '../types';
import { generateBlogDescription } from '../services/ai';
import { supabase } from '../services/supabase';

interface BlogEditorProps {
  initialData?: Blog | null;
  onSave: (blog: Omit<Blog, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export function BlogEditor({ initialData, onSave, onClose }: BlogEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [wordCount, setWordCount] = useState<number>(200);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show loading state while uploading
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
          
          // Compress to Blob
          canvas.toBlob(async (blob) => {
            if (!blob) {
              setIsGenerating(false);
              return;
            }
            
            try {
              // Create a unique file name
              const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
              
              // We need to import supabase at the top of this file to use it here.
              // Assuming it's imported as `import { supabase } from '../services/supabase';`
              const { error } = await supabase.storage
                .from('blog-images')
                .upload(fileName, blob, {
                  contentType: 'image/jpeg',
                  upsert: false
                });
                
              if (error) throw error;
              
              // Get public URL
              const { data: { publicUrl } } = supabase.storage
                .from('blog-images')
                .getPublicUrl(fileName);
                
              setCoverImage(publicUrl);
            } catch (err) {
              console.error("Error uploading image:", err);
              alert("Failed to upload image to Supabase. Ensure you created the 'blog-images' bucket and set it to Public.");
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
      alert("Please enter a topic/title first to generate a description.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const generatedText = await generateBlogDescription(title, wordCount);
      setDescription(generatedText);
    } catch (error) {
      alert(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!title) {
      alert("Please provide a title/topic.");
      return;
    }
    onSave({ title, description, coverImage });
    onClose();
  };

  // Close on Escape key
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
      <div className="modal-content">
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
            <div className="flex justify-between items-center mb-2">
              <label className="input-label">AI Description Generator</label>
              <div className="flex items-center gap-2">
                <span className="text-dim" style={{ fontSize: '0.85rem' }}>Max words:</span>
                <input 
                  type="number" 
                  className="input" 
                  style={{ width: '80px', padding: '6px 10px', fontSize: '0.9rem' }}
                  value={wordCount}
                  onChange={e => setWordCount(Number(e.target.value))}
                  min={50}
                  max={1000}
                />
              </div>
            </div>
            
            <button 
              className="btn btn-secondary w-full" 
              onClick={handleGenerateAI}
              disabled={isGenerating || !title}
            >
              {isGenerating ? <><Loader2 size={18} className="spin" /> Generating Magic...</> : <><Sparkles size={18} /> Generate Description with AI</>}
            </button>
          </div>

          <div className="input-group mt-4">
            <label className="input-label">Description Content</label>
            <textarea 
              className="input" 
              placeholder="Your blog description will appear here..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn" style={{ background: 'transparent', color: 'var(--text)' }} onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            {initialData ? 'Save Changes' : 'Create Blog'}
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
