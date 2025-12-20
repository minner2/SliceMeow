import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, Trash2, Grid, Clipboard, Upload } from 'lucide-react';

interface PuzzleImage {
  id: string;
  url: string;
  width: number;
  height: number;
}

type FitMode = 'contain' | 'cover' | 'fill';

interface PuzzleEditorProps {
  onBack: () => void;
}

const PuzzleEditor: React.FC<PuzzleEditorProps> = ({ onBack }) => {
  const [images, setImages] = useState<PuzzleImage[]>([]);
  const [cols, setCols] = useState(2);
  const [gap, setGap] = useState(8);
  const [fitMode, setFitMode] = useState<FitMode>('cover');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImageFromFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImages(prev => [...prev, {
        id: Date.now().toString() + Math.random(),
        url,
        width: img.width,
        height: img.height
      }]);
    };
    img.src = url;
  };

  // 监听粘贴事件
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) addImageFromFile(file);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(addImageFromFile);
    e.target.value = '';
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const newImages = [...images];
    const [dragged] = newImages.splice(dragIndex, 1);
    newImages.splice(index, 0, dragged);
    setImages(newImages);
    setDragIndex(index);
  };

  const handleDragEnd = () => setDragIndex(null);

  const removeImage = (id: string) => {
    const img = images.find(i => i.id === id);
    if (img) URL.revokeObjectURL(img.url);
    setImages(images.filter(i => i.id !== id));
  };

  const exportPuzzle = async () => {
    if (images.length === 0) return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const rows = Math.ceil(images.length / cols);
    const cellWidth = 400;
    const cellHeight = 400;

    canvas.width = cols * cellWidth + (cols - 1) * gap;
    canvas.height = rows * cellHeight + (rows - 1) * gap;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const loadedImages = await Promise.all(
      images.map(img => {
        return new Promise<HTMLImageElement>((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.src = img.url;
        });
      })
    );

    loadedImages.forEach((img, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const x = col * (cellWidth + gap);
      const y = row * (cellHeight + gap);

      if (fitMode === 'fill') {
        ctx.drawImage(img, x, y, cellWidth, cellHeight);
      } else if (fitMode === 'cover') {
        const scale = Math.max(cellWidth / img.width, cellHeight / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const sx = (w - cellWidth) / 2 / scale;
        const sy = (h - cellHeight) / 2 / scale;
        ctx.drawImage(img, sx, sy, img.width - sx * 2, img.height - sy * 2, x, y, cellWidth, cellHeight);
      } else {
        const scale = Math.min(cellWidth / img.width, cellHeight / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        ctx.drawImage(img, x + (cellWidth - w) / 2, y + (cellHeight - h) / 2, w, h);
      }
    });

    canvas.toBlob(blob => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'puzzle.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  };

  const fitModeClass = fitMode === 'contain' ? 'object-contain' : fitMode === 'cover' ? 'object-cover' : 'object-fill';

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} /> 返回
        </button>
        <h2 className="text-2xl font-bold">🧩 拼图工具</h2>
        <button
          onClick={exportPuzzle}
          disabled={images.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Download size={18} /> 导出拼图
        </button>
      </div>

      {/* 控制面板 */}
      <div className="flex flex-wrap items-center gap-6 mb-6 p-4 bg-secondary/50 rounded-xl">
        <div className="flex items-center gap-2">
          <Grid size={18} className="text-muted-foreground" />
          <span className="text-sm">列数:</span>
          <input type="range" min="1" max="6" value={cols} onChange={e => setCols(Number(e.target.value))} className="w-24" />
          <span className="w-6 text-center">{cols}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">间距:</span>
          <input type="range" min="0" max="32" value={gap} onChange={e => setGap(Number(e.target.value))} className="w-24" />
          <span className="w-8 text-center">{gap}px</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">适配:</span>
          <select value={fitMode} onChange={e => setFitMode(e.target.value as FitMode)} className="px-2 py-1 bg-secondary rounded text-sm">
            <option value="cover">裁剪填充</option>
            <option value="contain">保持比例</option>
            <option value="fill">拉伸填充</option>
          </select>
        </div>
        <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 rounded-lg text-sm transition-colors">
          <Upload size={16} /> 上传图片
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
      </div>

      {/* 粘贴提示 */}
      {images.length === 0 ? (
        <div className="h-72 border-2 border-dashed border-primary/30 rounded-2xl bg-secondary/30 flex flex-col items-center justify-center gap-4">
          <Clipboard size={48} className="text-primary/50" />
          <p className="text-lg text-muted-foreground">按 <kbd className="px-2 py-1 bg-secondary rounded">Ctrl+V</kbd> 粘贴图片 或点击上方上传</p>
          <p className="text-sm text-muted-foreground/60">支持多张图片</p>
        </div>
      ) : (
        <div
          className="grid rounded-xl overflow-hidden bg-secondary/30 p-4"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: `${gap}px` }}
        >
          {images.map((img, index) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={e => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative aspect-square bg-secondary overflow-hidden cursor-move group ${gap > 0 ? 'rounded-lg' : ''} ${dragIndex === index ? 'opacity-50 scale-95' : ''} transition-all`}
            >
              <img src={img.url} alt="" className={`w-full h-full ${fitModeClass}`} />
              <button
                onClick={() => removeImage(img.id)}
                className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <Trash2 size={14} />
              </button>
              <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/50 text-white text-xs rounded">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PuzzleEditor;
