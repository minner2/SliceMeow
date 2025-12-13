import React, { useState, useRef, useEffect, MouseEvent, WheelEvent } from 'react';
import { GridConfig } from '../types';
import { MoveHorizontal, MoveVertical, RotateCcw, LayoutGrid, ZoomIn, SeparatorHorizontal } from 'lucide-react';

interface GridEditorProps {
  imageSrc: string;
  config: GridConfig;
  onChangeConfig: (config: GridConfig) => void;
  onGenerate: () => void;
  onBack: () => void;
}

const GridEditor: React.FC<GridEditorProps> = ({ imageSrc, config, onChangeConfig, onGenerate, onBack }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingLine, setDraggingLine] = useState<{ type: 'h' | 'v', index: number } | null>(null);
  const [scale, setScale] = useState(1);

  // Initialize lines when row/col count changes
  useEffect(() => {
    const newHLines = Array.from({ length: config.rows - 1 }, (_, i) => ((i + 1) / config.rows) * 100);
    const newVLines = Array.from({ length: config.cols - 1 }, (_, i) => ((i + 1) / config.cols) * 100);
    
    // Only update if counts don't match existing lines (prevents resetting when dragging)
    if (newHLines.length !== config.horizontalLines.length || newVLines.length !== config.verticalLines.length) {
       onChangeConfig({
        ...config,
        horizontalLines: newHLines,
        verticalLines: newVLines,
      });
    }
  }, [config.rows, config.cols]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMouseDown = (type: 'h' | 'v', index: number, e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingLine({ type, index });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingLine || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    let percent = 0;

    if (draggingLine.type === 'h') {
      const relativeY = e.clientY - rect.top;
      percent = (relativeY / rect.height) * 100;
    } else {
      const relativeX = e.clientX - rect.left;
      percent = (relativeX / rect.width) * 100;
    }

    // Clamp between 0 and 100
    percent = Math.max(0.1, Math.min(99.9, percent));

    if (draggingLine.type === 'h') {
      const newLines = [...config.horizontalLines];
      newLines[draggingLine.index] = percent;
      onChangeConfig({ ...config, horizontalLines: newLines });
    } else {
      const newLines = [...config.verticalLines];
      newLines[draggingLine.index] = percent;
      onChangeConfig({ ...config, verticalLines: newLines });
    }
  };

  const handleMouseUp = () => {
    setDraggingLine(null);
  };

  const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
          e.preventDefault();
          const delta = -e.deltaY * 0.001;
          const newScale = Math.min(Math.max(0.1, scale + delta), 5);
          setScale(newScale);
      }
  };

  const resetGrid = () => {
    const newHLines = Array.from({ length: config.rows - 1 }, (_, i) => ((i + 1) / config.rows) * 100);
    const newVLines = Array.from({ length: config.cols - 1 }, (_, i) => ((i + 1) / config.cols) * 100);
    onChangeConfig({ ...config, horizontalLines: newHLines, verticalLines: newVLines });
    setScale(1);
  }

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto p-4 gap-6">
      
      {/* Controls Header */}
      <div className="bg-secondary/50 backdrop-blur-sm p-4 rounded-xl border border-border flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <LayoutGrid size={20} />
             </div>
             <div>
                <label className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">行数</label>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  value={config.rows}
                  onChange={(e) => onChangeConfig({...config, rows: parseInt(e.target.value) || 1})}
                  className="w-16 bg-background border border-border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
             </div>
             <span className="text-muted-foreground font-light text-xl mt-4">×</span>
             <div>
                <label className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">列数</label>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  value={config.cols}
                  onChange={(e) => onChangeConfig({...config, cols: parseInt(e.target.value) || 1})}
                  className="w-16 bg-background border border-border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
             </div>
          </div>

          <div className="h-8 w-px bg-border hidden sm:block"></div>

          <div className="flex items-center gap-3">
             <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <SeparatorHorizontal size={20} />
             </div>
             <div className="flex flex-col">
                <label className="block text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1 flex justify-between">
                    切割线粗细 <span className="text-primary">{config.gutterSize}px</span>
                </label>
                <input 
                    type="range" 
                    min="0" max="50" step="1"
                    value={config.gutterSize}
                    onChange={(e) => onChangeConfig({...config, gutterSize: parseInt(e.target.value)})}
                    className="w-32 h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
                    title="调节此选项可自动消除图片间的黑边或间隙"
                />
             </div>
          </div>

          <div className="h-8 w-px bg-border hidden sm:block"></div>

          <button 
            onClick={resetGrid}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <RotateCcw size={14} /> 重置
          </button>
        </div>

        <div className="flex items-center gap-3">
            <button onClick={onBack} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                取消
            </button>
            <button 
                onClick={onGenerate}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-primary/25 transition-all active:scale-95"
            >
                生成切片
            </button>
        </div>
      </div>

      {/* Editor Area */}
      <div 
        className="flex-1 bg-black/20 rounded-xl border border-border overflow-auto relative select-none flex items-center justify-center min-h-[500px]"
        onWheel={handleWheel}
      >
        <div 
            className="relative shadow-2xl transition-transform duration-75 origin-center"
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ transform: `scale(${scale})` }}
        >
            <img 
                src={imageSrc} 
                alt="Source" 
                className="max-w-none block object-contain select-none pointer-events-none"
                draggable={false}
                style={{ maxHeight: 'calc(100vh - 250px)' }} // Ensure it fits initially
            />

            {/* Overlay */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Horizontal Lines */}
                {config.horizontalLines.map((pos, idx) => {
                    // Visual height: if gutter is 0, show a 1px line. If > 0, show actual gutter size.
                    const visualSize = Math.max(1, config.gutterSize);
                    return (
                        <div
                            key={`h-${idx}`}
                            className="absolute w-full bg-red-500/50 hover:bg-red-400/80 cursor-row-resize flex items-center justify-center group pointer-events-auto"
                            style={{ 
                                top: `${pos}%`, 
                                height: `${visualSize}px`,
                                transform: 'translateY(-50%)', // Center align
                                borderTop: config.gutterSize === 0 ? '1px dashed rgba(255,0,0,0.8)' : 'none'
                            }}
                            onMouseDown={(e) => handleMouseDown('h', idx, e)}
                        >
                            {/* Hit area extension for thin lines */}
                            <div className="w-full h-4 absolute -z-10" /> 
                            
                            <div className="w-full h-4 absolute opacity-0 group-hover:opacity-100 flex justify-center items-center pointer-events-none">
                                <div className="bg-red-500 text-white text-[10px] px-1 rounded-full shadow"><MoveVertical size={10} /></div>
                            </div>
                        </div>
                    );
                })}

                {/* Vertical Lines */}
                {config.verticalLines.map((pos, idx) => {
                    const visualSize = Math.max(1, config.gutterSize);
                    return (
                        <div
                            key={`v-${idx}`}
                            className="absolute h-full bg-red-500/50 hover:bg-red-400/80 cursor-col-resize flex items-center justify-center group pointer-events-auto"
                            style={{ 
                                left: `${pos}%`,
                                width: `${visualSize}px`,
                                transform: 'translateX(-50%)', // Center align
                                borderLeft: config.gutterSize === 0 ? '1px dashed rgba(255,0,0,0.8)' : 'none'
                            }}
                            onMouseDown={(e) => handleMouseDown('v', idx, e)}
                        >
                            {/* Hit area extension for thin lines */}
                            <div className="h-full w-4 absolute -z-10" />

                            <div className="h-full w-4 absolute opacity-0 group-hover:opacity-100 flex justify-center items-center pointer-events-none">
                                <div className="bg-red-500 text-white text-[10px] py-1 rounded-full shadow"><MoveHorizontal size={10} /></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      </div>
      <div className="flex justify-between items-center text-muted-foreground text-sm">
        <p>提示：您可以直接拖动红线来调整。</p>
        <p className="flex items-center gap-2">
            <ZoomIn size={14} />
            按住 Ctrl + 滚轮缩放视图 ({Math.round(scale * 100)}%)
        </p>
      </div>
    </div>
  );
};

export default GridEditor;