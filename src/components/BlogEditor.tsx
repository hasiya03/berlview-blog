import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import type { Blog } from '../types';
import { generateBlogDescription } from '../services/ai';
import { supabase } from '../services/supabase';

// Rich Text Editor dependencies
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import TurndownService from 'turndown';
import { marked } from 'marked';

interface BlogEditorProps {
  initialData?: Blog | null;
  onSave: (blog: Omit<Blog, 'id' | 'createdAt'>) => void;
  onClose: () => void;
}

export function BlogEditor({ initialData, onSave, onClose }: BlogEditorProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [shortDescription, setShortDescription] = useState(initialData?.description || '');
  const [isActive, setIsActive] = useState(initialData?.is_active ?? false);
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  
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

  const quillRef = useRef<ReactQuill>(null);

  // Custom image handler to upload inline images to Supabase instead of converting to Base64
  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files ? input.files[0] : null;
      if (!file) return;

      setIsGenerating(true);
      try {
        const fileName = `inline-${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
        const { error } = await supabase.storage
          .from('blog-images')
          .upload(fileName, file, { upsert: false });
          
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('blog-images')
          .getPublicUrl(fileName);
          
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', publicUrl);
          quill.setSelection(range.index + 1, 0); // Move cursor after the image
        }
      } catch (err) {
        console.error("Error uploading inline image:", err);
        alert("Failed to upload inline image to Supabase.");
      } finally {
        setIsGenerating(false);
      }
    };
  };

  // Quill modules configuration for the toolbar
  // Must use useMemo to prevent the editor from losing focus on re-renders
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['blockquote', 'code-block', 'link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
  }), []);

  useEffect(() => {
    async function loadExistingContent() {
      if (initialData?.markdownUrl) {
        try {
          const response = await fetch(initialData.markdownUrl);
          if (response.ok) {
            const mdText = await response.text();
            
            // Strip out the title and "Published on" date that we automatically prepend on save
            // to prevent them from stacking up every time we edit and save.
            let cleanMdText = mdText;
            
            // Look for the auto-generated "# Title\n\n*Published on Date*\n\n" prefix
            const lines = mdText.split('\n');
            if (lines.length >= 4 && lines[0].startsWith('# ') && lines[2].startsWith('*Published on')) {
              cleanMdText = lines.slice(4).join('\n');
            }
            
            // Parse Markdown back into HTML for the Quill editor
            const htmlContent = await marked.parse(cleanMdText);
            setContent(htmlContent);
          } else {
            setContent('<p><em>Failed to load existing markdown content.</em></p>');
          }
        } catch (error) {
          console.error("Error loading markdown:", error);
          setContent('<p><em>Error loading existing markdown content.</em></p>');
        }
      }
    }
    
    loadExistingContent();
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

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
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
      // Parse HTML to find and upload base64 images
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const images = tempDiv.querySelectorAll('img');
      
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        if (img.src.startsWith('data:image/')) {
          const matches = img.src.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
          if (matches) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            const ext = mimeType.split('/')[1] || 'png';
            
            try {
              const byteCharacters = atob(base64Data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let j = 0; j < byteCharacters.length; j++) {
                byteNumbers[j] = byteCharacters.charCodeAt(j);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: mimeType });
              
              const imgFileName = `inline-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
              const { error: imgError } = await supabase.storage
                .from('blog-images')
                .upload(imgFileName, blob, { contentType: mimeType, upsert: false });
                
              if (!imgError) {
                const { data: { publicUrl: imgUrl } } = supabase.storage
                  .from('blog-images')
                  .getPublicUrl(imgFileName);
                img.src = imgUrl;
              }
            } catch (err) {
              console.error("Error processing base64 image", err);
            }
          }
        }
      }
      
      // Convert the processed HTML to Markdown using Turndown
      const contentMarkdown = turndownService.turndown(tempDiv.innerHTML);
      
      // We no longer prepend the title and date here, so the markdown file contains exactly what is in the editor.
      const markdownDocument = `${contentMarkdown}\n`;
      
      // Upload the markdown to Supabase Storage
      const blob = new Blob([markdownDocument], { type: 'text/markdown' });
      const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(7)}.md`;
      
      const { error } = await supabase.storage
        .from('blog-md') // Use the new blog-md bucket
        .upload(fileName, blob, {
          contentType: 'text/markdown',
          upsert: false
        });
        
      if (error) throw error;
      
      const { data: { publicUrl: markdownUrl } } = supabase.storage
        .from('blog-md')
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
        markdownUrl,
        is_active: isActive,
        tags
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
      <div className="modal-content" style={{ maxWidth: '100vw', width: '100%', height: '100vh', maxHeight: '100vh', borderRadius: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles className="text-accent" size={24} />
            {initialData ? 'Edit Blog' : 'Create New Blog'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{isActive ? 'Active' : 'Inactive'}</span>
              <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                <input 
                  type="checkbox" 
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)} 
                  style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                />
                <div style={{
                  width: '44px', height: '24px', backgroundColor: isActive ? 'var(--accent)' : 'var(--border)',
                  borderRadius: '12px', position: 'relative', transition: 'background-color 0.2s'
                }}>
                  <div style={{
                    width: '20px', height: '20px', backgroundColor: 'white', borderRadius: '50%',
                    position: 'absolute', top: '2px', left: isActive ? '22px' : '2px', transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                  }} />
                </div>
              </label>
            </div>
            <button className="btn-icon" onClick={onClose}><X size={24} /></button>
          </div>
        </div>
        
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto' }}>
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
            <label className="input-label">Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
              {tags.map(tag => (
                <span key={tag} style={{ 
                  display: 'flex', alignItems: 'center', gap: '4px',
                  background: 'var(--accent)', color: 'white', padding: '4px 12px',
                  borderRadius: '16px', fontSize: '0.85rem'
                }}>
                  #{tag}
                  <button 
                    onClick={() => removeTag(tag)}
                    style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <input 
              type="text" 
              className="input" 
              placeholder="Add tags separated by comma or enter..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
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
                ref={quillRef}
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
