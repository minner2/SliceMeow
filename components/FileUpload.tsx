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
      className="w-full max-w-2xl mx-auto h-72 border-2 border-dashed border-primary/30 rounded-2xl bg-gradient-to-br from-secondary/50 to-secondary/20 hover:from-secondary/60 hover:to-secondary/30 hover:border-primary/50 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group relative overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <input
        type="file"
        id="fileInput"
        className="hidden"
        accept="image/*"
        onChange={handleChange}
      />
      <div className="p-5 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 mb-5 animate-float group-hover:shadow-lg group-hover:shadow-primary/20">
        <Upload className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">上传网格图片</h3>
      <p className="text-muted-foreground text-sm">点击选择或将文件拖拽至此处</p>
      <div className="mt-5 flex gap-2 items-center text-xs text-muted-foreground/60 px-4 py-2 rounded-full bg-secondary/50">
        <ImageIcon className="w-4 h-4" />
        <span>支持 JPG, PNG, WEBP</span>
      </div>
    </div>
  );
};

export default FileUpload;