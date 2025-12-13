import React, { useState, useMemo } from 'react';
import { Slice } from '../types';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { Download, X, Crop, Layers, Trash2, Check, RefreshCw, MousePointer2, Move, GripHorizontal } from 'lucide-react';
import { manualCropSlice, splitSlice } from '../services/imageProcessing';

interface ResultGalleryProps {
  slices: Slice[];
  onBack: () => void;
  onUpdateSlice: (index: number, newSlice: Slice) => void;
}

interface ExtendedResultGalleryProps extends ResultGalleryProps {
    onSetSlices?: (slices: Slice[]) => void;
}

const ResultGallery: React.FC<ExtendedResultGalleryProps> = ({ slices, onBack, onUpdateSlice, onSetSlices }) => {
  const [isZipping, setIsZipping] = useState(false);
  
  // Selection & Drag States
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Editing States
  const [editingSliceIndex, setEditingSliceIndex] = useState<number | null>(null);
  const [cropBox, setCropBox] = useState<{x: number, y: number, w: number, h: number} | null>(null);

  // View States
  const [bgColor, setBgColor] = useState<string>('bg-transparent');

  // Batch Split States
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  // type: 'row' | 'col' | 'custom' (for manual selection)
  const [batchTarget, setBatchTarget] = useState<{type: 'row' | 'col' | 'custom', index: number}>({ type: 'row', index: 0 });
  const [batchSplitPos, setBatchSplitPos] = useState(50);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchAxis, setBatchAxis] = useState<'horizontal' | 'vertical'>('horizontal'); // Default split direction
  const [keepPart, setKeepPart] = useState<'both' | 'first' | 'second'>('both'); // New: Choose which part to keep

  // Derived data
  const maxRow = useMemo(() => Math.max(...slices.map(s => s.row), 0), [slices]);
  const maxCol = useMemo(() => Math.max(...slices.map(s => s.col), 0), [slices]);
  
  // Get slices for current batch target
  const targetSlices = useMemo(() => {
    if (batchTarget.type === 'custom') {
        // Return slices that are in the selectedIds set, preserving current array order
        return slices.filter(s => selectedIds.has(s.id));
    }
    return slices.filter(s => 
        batchTarget.type === 'row' ? s.row === batchTarget.index : s.col === batchTarget.index
    ).sort((a,b) => batchTarget.type === 'row' ? a.col - b.col : a.row - b.row);
  }, [slices, batchTarget, selectedIds]);

  const handleDownloadAll = async () => {
    setIsZipping(true);
    const zip = new JSZip();
    const folder = zip.folder("slices");

    slices.forEach((slice, i) => {
      // Use index in filename to ensure unique names if row/col are messed up by DnD
      folder?.file(`slice_${i}_R${slice.row}_C${slice.col}.png`, slice.blob);
    });

    const content = await zip.generateAsync({ type: "blob" });
    const save = (FileSaver as any).saveAs || FileSaver;
    save(content, "slices.zip");

    setIsZipping(false);
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    // Set transparent drag image or similar if needed, default is usually fine
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); // Necessary to allow dropping
    if (draggedIndex === null || draggedIndex === index) return;
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || !onSetSlices) return;

    const newSlices = [...slices];
    const [draggedItem] = newSlices.splice(draggedIndex, 1);
    newSlices.splice(dropIndex, 0, draggedItem);
    
    onSetSlices(newSlices);
    setDraggedIndex(null);
  };

  // --- Selection Logic ---
  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedIds(newSet);
  };

  const handleOpenBatchModal = () => {
      if (selectedIds.size > 0) {
          setBatchTarget({ type: 'custom', index: 0 });
      } else {
          setBatchTarget({ type: 'row', index: 0 });
      }
      // Reset defaults
      setBatchSplitPos(50);
      setBatchAxis('horizontal'); 
      setKeepPart('both');
      setIsBatchModalOpen(true);
  };

  // --- Single Operations ---
  const handleDeleteSlice = (index: number) => {
      if (!onSetSlices) return;
      const sliceId = slices[index].id;
      const newSlices = slices.filter((_, i) => i !== index);
      onSetSlices(newSlices);
      // Remove from selection if deleted
      if (selectedIds.has(sliceId)) {
          const newSet = new Set(selectedIds);
          newSet.delete(sliceId);
          setSelectedIds(newSet);
      }
  };

  const handleEditClick = (index: number) => {
    setEditingSliceIndex(index);
    setCropBox({x: 0, y: 0, w: slices[index].width, h: slices[index].height});
  };

  const handleManualCropSave = async () => {
      if(editingSliceIndex === null || !cropBox) return;
      const original = slices[editingSliceIndex];
      const newSlice = await manualCropSlice(original, cropBox);
      onUpdateSlice(editingSliceIndex, newSlice);
      setEditingSliceIndex(null);
  };

  // --- Batch Operations ---
  const handleBatchSplit = async () => {
      if (!onSetSlices || targetSlices.length === 0) return;
      setIsBatchProcessing(true);

      const processedIds = new Set(targetSlices.map(s => s.id));
      const finalSlices: Slice[] = [];

      for (const slice of slices) {
          if (processedIds.has(slice.id)) {
              // Split logic
              const [s1, s2] = await splitSlice(slice, batchSplitPos, batchAxis);
              
              // Keep Logic
              if (keepPart === 'both') {
                  finalSlices.push(s1);
                  finalSlices.push(s2);
              } else if (keepPart === 'first') {
                  finalSlices.push(s1);
              } else if (keepPart === 'second') {
                  finalSlices.push(s2);
              }
          } else {
              finalSlices.push(slice);
          }
      }

      onSetSlices(finalSlices);
      setIsBatchProcessing(false);
      setIsBatchModalOpen(false);
      setSelectedIds(new Set()); // Clear selection after op
      setIsSelectMode(false);
  };

  // BG Options
  const bgOptions = [
      { id: 'bg-[url("https://www.transparenttextures.com/patterns/stardust.png")]', label: '透明', color: 'bg-slate-700' },
      { id: 'bg-white', label: '白色', color: 'bg-white' },
      { id: 'bg-black', label: '黑色', color: 'bg-black' },
      { id: 'bg-gray-500', label: '灰色', color: 'bg-gray-500' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-4 flex flex-col gap-6 h-full">
      
      {/* Action Header */}
      <div className="bg-secondary/50 backdrop-blur-sm p-4 rounded-xl border border-border flex flex-wrap items-center justify-between gap-4 sticky top-4 z-20 shadow-lg">
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">{slices.length}</span>
                结果
            </h2>
            
            <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/10">
                {bgOptions.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => setBgColor(opt.id)}
                        className={`w-6 h-6 rounded-full border border-white/20 shadow-sm ${opt.color} ${bgColor === opt.id ? 'ring-2 ring-primary ring-offset-1 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'}`}
                        title={`背景色: ${opt.label}`}
                    />
                ))}
            </div>

            <button 
                onClick={() => { setIsSelectMode(!isSelectMode); setSelectedIds(new Set()); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors border ${isSelectMode ? 'bg-primary text-white border-primary' : 'bg-transparent text-muted-foreground border-border hover:border-primary'}`}
            >
                <MousePointer2 size={16} />
                {isSelectMode ? '退出选择' : '选择模式'}
            </button>
            {isSelectMode && selectedIds.size > 0 && (
                <span className="text-sm text-primary animate-pulse">已选 {selectedIds.size} 张</span>
            )}
        </div>

        <div className="flex items-center gap-3">
             <button onClick={onBack} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">返回编辑</button>
            <div className="h-6 w-px bg-border mx-2"></div>

            <button 
                onClick={handleOpenBatchModal}
                className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 border border-border text-foreground px-4 py-2 rounded-lg font-medium transition-colors"
            >
                <Layers size={16} />
                {selectedIds.size > 0 ? '批量切割选中项' : '批量二次切割'}
            </button>

            <button 
                onClick={handleDownloadAll}
                disabled={isZipping}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium shadow-lg shadow-primary/25 transition-all active:scale-95 disabled:opacity-50"
            >
                {isZipping ? <RefreshCw className="animate-spin" size={16} /> : <Download size={16} />}
                下载 ZIP
            </button>
        </div>
      </div>

      {/* Grid Display */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-20">
        {slices.map((slice, idx) => {
            const isSelected = selectedIds.has(slice.id);
            return (
                <div 
                    key={slice.id} 
                    draggable={!isSelectMode} // Enable drag only when not in select mode
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onClick={() => isSelectMode && toggleSelection(slice.id)}
                    className={`
                        group relative bg-black/40 rounded-lg overflow-hidden flex flex-col transition-all
                        border-2 ${isSelected ? 'border-primary shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105 z-10' : 'border-border hover:border-primary/50'}
                        ${!isSelectMode ? 'cursor-move' : 'cursor-pointer'}
                    `}
                >
                    <div className={`aspect-square flex items-center justify-center p-2 ${bgColor === 'bg-[url("https://www.transparenttextures.com/patterns/stardust.png")]' ? 'bg-[url("https://www.transparenttextures.com/patterns/stardust.png")]' : bgColor} overflow-hidden`}>
                        <img src={slice.url} className="max-w-full max-h-full object-contain shadow-sm pointer-events-none" alt={`Slice ${idx}`} />
                    </div>
                    
                    {/* Hover Overlay for Drag Handle (Visual Cue) */}
                    {!isSelectMode && (
                        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-1 rounded text-white pointer-events-none">
                            <Move size={14}/>
                        </div>
                    )}
                    
                    {/* Checkmark for Selection */}
                    {isSelectMode && (
                        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border border-white flex items-center justify-center ${isSelected ? 'bg-primary' : 'bg-black/50'}`}>
                            {isSelected && <Check size={12} className="text-white"/>}
                        </div>
                    )}

                    <div className="p-2 bg-secondary/90 text-xs flex justify-between items-center border-t border-border mt-auto">
                        <span className="text-muted-foreground font-mono">#{idx+1}</span>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <button onClick={() => handleEditClick(idx)} className="text-muted-foreground hover:text-primary p-1 rounded hover:bg-primary/10" title="单独裁剪"><Crop size={14} /></button>
                             <button onClick={() => handleDeleteSlice(idx)} className="text-muted-foreground hover:text-red-500 p-1 rounded hover:bg-red-500/10" title="删除"><Trash2 size={14} /></button>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {/* Manual Crop Modal (Single) */}
      {editingSliceIndex !== null && cropBox && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-secondary border border-border rounded-xl p-6 max-w-4xl w-full flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">单独裁剪 (切片 #{editingSliceIndex + 1})</h3>
                      <button onClick={() => setEditingSliceIndex(null)}><X size={20} className="text-muted-foreground hover:text-white"/></button>
                  </div>
                  {/* Reuse existing logic for single crop UI */}
                  <div className="flex gap-8 items-start h-[500px]">
                     <div className="flex-1 h-full relative border border-dashed border-primary/50 bg-black/50 flex items-center justify-center overflow-hidden">
                        <img 
                            src={slices[editingSliceIndex].url} 
                            style={{width: slices[editingSliceIndex].width, height: slices[editingSliceIndex].height}}
                            className="max-w-full max-h-full object-contain"
                            alt="To Crop"
                        />
                         <div className="absolute border-2 border-primary bg-primary/10 pointer-events-none" style={{left: '25%', top: '25%', width: '50%', height: '50%'}}>
                             <div className="absolute inset-0 flex items-center justify-center text-primary text-xs font-bold bg-black/50">参数调节见右侧</div>
                         </div>
                     </div>
                     <div className="w-64 flex flex-col gap-4">
                         <div className="p-4 bg-yellow-500/10 text-yellow-500 text-xs rounded">由于UI限制，请使用下方滑块进行裁剪。</div>
                         <div className="space-y-4">
                             <div className="space-y-1">
                                <label className="text-xs font-bold">X 偏移</label>
                                <input type="range" min="0" max={slices[editingSliceIndex].width} value={cropBox.x} onChange={e => setCropBox({...cropBox!, x: Number(e.target.value)})} className="w-full accent-primary" />
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-bold">Y 偏移</label>
                                <input type="range" min="0" max={slices[editingSliceIndex].height} value={cropBox.y} onChange={e => setCropBox({...cropBox!, y: Number(e.target.value)})} className="w-full accent-primary" />
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-bold">宽度</label>
                                <input type="range" min="1" max={slices[editingSliceIndex].width - cropBox.x} value={cropBox.w} onChange={e => setCropBox({...cropBox!, w: Number(e.target.value)})} className="w-full accent-primary" />
                             </div>
                             <div className="space-y-1">
                                <label className="text-xs font-bold">高度</label>
                                <input type="range" min="1" max={slices[editingSliceIndex].height - cropBox.y} value={cropBox.h} onChange={e => setCropBox({...cropBox!, h: Number(e.target.value)})} className="w-full accent-primary" />
                             </div>
                         </div>
                         <div className="mt-auto flex gap-2">
                             <button onClick={() => setEditingSliceIndex(null)} className="flex-1 py-2 rounded border border-border">取消</button>
                             <button onClick={handleManualCropSave} className="flex-1 py-2 rounded bg-primary text-white">确定</button>
                         </div>
                     </div>
                  </div>
              </div>
          </div>
      )}

      {/* Batch Split Modal */}
      {isBatchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-secondary border border-border rounded-xl flex flex-col w-full max-w-6xl h-[85vh] overflow-hidden shadow-2xl animate-accordion-down">
                  {/* Header */}
                  <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/50">
                      <div>
                          <h3 className="text-lg font-bold flex items-center gap-2">
                              <Layers className="text-primary" size={20}/>
                              批量二次切割
                          </h3>
                          <p className="text-xs text-muted-foreground">对选中的一组图片应用相同的切割线，并自动删除不需要的部分。</p>
                      </div>
                      <button onClick={() => setIsBatchModalOpen(false)}><X className="text-muted-foreground hover:text-foreground" /></button>
                  </div>

                  <div className="flex-1 flex overflow-hidden">
                      {/* Sidebar: Selection & Settings */}
                      <div className="w-64 border-r border-border bg-black/20 overflow-y-auto p-4 flex flex-col gap-6">
                          
                          {/* 1. Target Selection */}
                          <div>
                            <div className="text-xs font-bold text-muted-foreground uppercase mb-2">1. 选择对象</div>
                            {batchTarget.type === 'custom' ? (
                                <div className="p-3 bg-primary/10 border border-primary/20 rounded text-sm text-primary mb-2">
                                    自定义选择模式<br/>
                                    <span className="font-bold">已选中 {targetSlices.length} 张图片</span>
                                    <button onClick={() => setBatchTarget({type:'row', index: 0})} className="block mt-2 text-xs underline opacity-70 hover:opacity-100">切换回行列选择</button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-1 max-h-40 overflow-y-auto border border-border rounded p-1">
                                    {Array.from({length: maxRow + 1}).map((_, i) => (
                                        <button 
                                            key={`r-${i}`}
                                            onClick={() => setBatchTarget({type: 'row', index: i})}
                                            className={`text-left px-2 py-1.5 rounded text-xs transition-colors ${batchTarget.type === 'row' && batchTarget.index === i ? 'bg-primary text-white' : 'hover:bg-white/5 text-muted-foreground'}`}
                                        >
                                            按行: 第 {i + 1} 行
                                        </button>
                                    ))}
                                    {Array.from({length: maxCol + 1}).map((_, i) => (
                                        <button 
                                            key={`c-${i}`}
                                            onClick={() => setBatchTarget({type: 'col', index: i})}
                                            className={`text-left px-2 py-1.5 rounded text-xs transition-colors ${batchTarget.type === 'col' && batchTarget.index === i ? 'bg-primary text-white' : 'hover:bg-white/5 text-muted-foreground'}`}
                                        >
                                            按列: 第 {i + 1} 列
                                        </button>
                                    ))}
                                </div>
                            )}
                          </div>

                          {/* 2. Cut Direction */}
                          <div>
                              <div className="text-xs font-bold text-muted-foreground uppercase mb-2">2. 切割方向</div>
                              <div className="flex gap-2">
                                  <button 
                                    onClick={() => setBatchAxis('horizontal')}
                                    className={`flex-1 py-2 rounded border text-sm flex flex-col items-center gap-1 ${batchAxis === 'horizontal' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-white/5'}`}
                                  >
                                      <GripHorizontal size={16} />
                                      横向切割
                                  </button>
                                  <button 
                                    onClick={() => setBatchAxis('vertical')}
                                    className={`flex-1 py-2 rounded border text-sm flex flex-col items-center gap-1 ${batchAxis === 'vertical' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-white/5'}`}
                                  >
                                      <GripHorizontal className="rotate-90" size={16} />
                                      纵向切割
                                  </button>
                              </div>
                          </div>

                          {/* 3. Keep Strategy */}
                          <div>
                              <div className="text-xs font-bold text-muted-foreground uppercase mb-2">3. 保留设置 (自动删除)</div>
                              <div className="flex flex-col gap-2">
                                  <label className="flex items-center gap-2 p-2 rounded border border-border bg-black/20 cursor-pointer hover:bg-black/30">
                                      <input type="radio" name="keep" checked={keepPart === 'both'} onChange={() => setKeepPart('both')} />
                                      <span className="text-sm">保留全部 (切成两张)</span>
                                  </label>
                                  <label className="flex items-center gap-2 p-2 rounded border border-border bg-black/20 cursor-pointer hover:bg-black/30">
                                      <input type="radio" name="keep" checked={keepPart === 'first'} onChange={() => setKeepPart('first')} />
                                      <span className="text-sm">{batchAxis === 'horizontal' ? '仅保留上半部分' : '仅保留左半部分'}</span>
                                  </label>
                                  <label className="flex items-center gap-2 p-2 rounded border border-border bg-black/20 cursor-pointer hover:bg-black/30">
                                      <input type="radio" name="keep" checked={keepPart === 'second'} onChange={() => setKeepPart('second')} />
                                      <span className="text-sm">{batchAxis === 'horizontal' ? '仅保留下半部分' : '仅保留右半部分'}</span>
                                  </label>
                              </div>
                          </div>

                      </div>

                      {/* Main Editor */}
                      <div className="flex-1 flex flex-col bg-black/40 p-6 relative">
                          <div className="flex-1 flex items-center justify-center relative select-none">
                              {targetSlices.length > 0 ? (
                                  <div className="relative group shadow-2xl">
                                      {/* Show first slice as reference */}
                                      <img 
                                        src={targetSlices[0].url} 
                                        alt="Reference" 
                                        className="max-w-full max-h-[50vh] object-contain block border border-white/10" 
                                        draggable={false}
                                      />
                                      
                                      {/* Cut Line Interface */}
                                      <div className="absolute inset-0">
                                          {batchAxis === 'horizontal' ? (
                                              // Horizontal Cut Line (Top/Bottom split)
                                              <div 
                                                className="absolute w-full h-0.5 bg-red-500 cursor-ns-resize flex items-center justify-center hover:h-1 transition-all group/line"
                                                style={{top: `${batchSplitPos}%`}}
                                                onMouseDown={(e) => {
                                                    const parent = e.currentTarget.parentElement;
                                                    if(!parent) return;
                                                    const handleMove = (ev: MouseEvent) => {
                                                        const rect = parent.getBoundingClientRect();
                                                        let pct = ((ev.clientY - rect.top) / rect.height) * 100;
                                                        pct = Math.max(1, Math.min(99, pct));
                                                        setBatchSplitPos(pct);
                                                    };
                                                    const handleUp = () => {
                                                        window.removeEventListener('mousemove', handleMove);
                                                        window.removeEventListener('mouseup', handleUp);
                                                    };
                                                    window.addEventListener('mousemove', handleMove);
                                                    window.addEventListener('mouseup', handleUp);
                                                }}
                                              >
                                                  <div className="absolute right-0 bg-red-500 text-white text-[10px] px-1 rounded-l translate-x-full">
                                                      {Math.round(batchSplitPos)}%
                                                  </div>
                                                  {/* Visual mask to show what will be deleted */}
                                                  {keepPart === 'second' && <div className="absolute bottom-full left-0 w-full h-[1000px] bg-red-500/20 pointer-events-none" />}
                                                  {keepPart === 'first' && <div className="absolute top-full left-0 w-full h-[1000px] bg-red-500/20 pointer-events-none" />}
                                              </div>
                                          ) : (
                                              // Vertical Cut Line (Left/Right split)
                                               <div 
                                                className="absolute h-full w-0.5 bg-red-500 cursor-ew-resize flex items-center justify-center hover:w-1 transition-all"
                                                style={{left: `${batchSplitPos}%`}}
                                                onMouseDown={(e) => {
                                                    const parent = e.currentTarget.parentElement;
                                                    if(!parent) return;
                                                    const handleMove = (ev: MouseEvent) => {
                                                        const rect = parent.getBoundingClientRect();
                                                        let pct = ((ev.clientX - rect.left) / rect.width) * 100;
                                                        pct = Math.max(1, Math.min(99, pct));
                                                        setBatchSplitPos(pct);
                                                    };
                                                    const handleUp = () => {
                                                        window.removeEventListener('mousemove', handleMove);
                                                        window.removeEventListener('mouseup', handleUp);
                                                    };
                                                    window.addEventListener('mousemove', handleMove);
                                                    window.addEventListener('mouseup', handleUp);
                                                }}
                                              >
                                                   <div className="absolute bottom-0 bg-red-500 text-white text-[10px] py-0.5 rounded-t translate-y-full">
                                                      {Math.round(batchSplitPos)}%
                                                  </div>
                                                   {/* Visual mask */}
                                                  {keepPart === 'second' && <div className="absolute right-full top-0 h-full w-[1000px] bg-red-500/20 pointer-events-none" />}
                                                  {keepPart === 'first' && <div className="absolute left-full top-0 h-full w-[1000px] bg-red-500/20 pointer-events-none" />}
                                              </div>
                                          )}
                                      </div>
                                  </div>
                              ) : (
                                  <div className="text-muted-foreground">该行/列没有切片</div>
                              )}
                          </div>
                          
                          <div className="mt-6 bg-secondary/80 p-4 rounded-lg flex items-center justify-between border border-border">
                              <div className="text-sm">
                                  <p className="font-bold text-foreground">将应用到 {targetSlices.length} 张图片</p>
                                  <p className="text-muted-foreground text-xs mt-1">
                                      {keepPart === 'both' ? '每张图切成两份，原图将被替换。' : '切分后只保留选定区域，原图将被替换。'}
                                  </p>
                              </div>
                              <div className="flex gap-3">
                                  <div className="flex items-center gap-2 px-3 py-2 bg-black/30 rounded border border-border">
                                    <label className="text-xs font-bold text-muted-foreground">位置</label>
                                    <input 
                                        type="number" 
                                        min="1" max="99" 
                                        value={Math.round(batchSplitPos)} 
                                        onChange={(e) => setBatchSplitPos(Number(e.target.value))}
                                        className="w-12 bg-transparent text-right outline-none font-mono"
                                    />
                                    <span className="text-muted-foreground text-xs">%</span>
                                  </div>
                                  <button 
                                    onClick={handleBatchSplit}
                                    disabled={isBatchProcessing || targetSlices.length === 0}
                                    className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded font-medium disabled:opacity-50 flex items-center gap-2"
                                  >
                                      {isBatchProcessing ? <RefreshCw className="animate-spin" size={16}/> : <Check size={16}/>}
                                      执行切割
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ResultGallery;