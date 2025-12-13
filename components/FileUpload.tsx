import React, { useCallback } from 'react';
import { Upload, ImageIcon } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      if (files[0].type.startsWith('image/')) {
        onFileSelect(files[0]);
      } else {
        alert("请上传图片文件。");
      }
    }
  }, [onFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div 
      className="w-full max-w-2xl mx-auto h-64 border-2 border-dashed border-muted-foreground/25 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors flex flex-col items-center justify-center cursor-pointer group"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <input 
        type="file" 
        id="fileInput" 
        className="hidden" 
        accept="image/*"
        onChange={handleChange}
      />
      <div className="p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors mb-4">
        <Upload className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">上传网格图片</h3>
      <p className="text-muted-foreground text-sm">点击选择或将文件拖拽至此处</p>
      <div className="mt-4 flex gap-2 items-center text-xs text-muted-foreground/60">
        <ImageIcon className="w-4 h-4" />
        <span>支持 JPG, PNG, WEBP</span>
      </div>
    </div>
  );
};

export default FileUpload;