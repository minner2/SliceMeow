import React, { useState } from 'react';
import { GridConfig, Slice } from './types';
import FileUpload from './components/FileUpload';
import GridEditor from './components/GridEditor';
import ResultGallery from './components/ResultGallery';
import { generateSlices } from './services/imageProcessing';
import { Scissors } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<'upload' | 'edit' | 'result'>('upload');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [config, setConfig] = useState<GridConfig>({
    rows: 3,
    cols: 3,
    horizontalLines: [],
    verticalLines: [],
    gutterSize: 0
  });
  const [slices, setSlices] = useState<Slice[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    // Reset default config when new image loads
    setConfig({
      rows: 3,
      cols: 3,
      horizontalLines: [],
      verticalLines: [],
      gutterSize: 0
    });
    setStep('edit');
  };

  const handleGenerate = async () => {
    if (!imageSrc) return;
    setIsProcessing(true);
    try {
      // Small timeout to allow UI to show processing state
      await new Promise(r => setTimeout(r, 100)); 
      
      const generated = await generateSlices(
        imageSrc,
        config.horizontalLines,
        config.verticalLines,
        config.gutterSize
      );
      setSlices(generated);
      setStep('result');
    } catch (error) {
      console.error("Failed to generate slices", error);
      alert("处理图片失败，请重试。");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSliceUpdate = (index: number, newSlice: Slice) => {
      const newSlices = [...slices];
      newSlices[index] = newSlice;
      setSlices(newSlices);
  };

  const handleSetSlices = (newSlices: Slice[]) => {
      setSlices(newSlices);
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-b from-secondary/40 to-transparent backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
              <Scissors className="text-white w-5 h-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight">Slice<span className="text-primary font-light">Meow</span></h1>
          </div>
          <div className="text-2xl font-bold bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
            切图喵
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
         {/* Background Decoration */}
         <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
            <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-primary/30 rounded-full blur-[128px] animate-pulse-glow"></div>
            <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-pulse-glow" style={{animationDelay: '2s'}}></div>
            <div className="absolute top-[50%] left-[50%] w-64 h-64 bg-cyan-500/10 rounded-full blur-[100px] animate-pulse-glow" style={{animationDelay: '1s'}}></div>
         </div>

        {step === 'upload' && (
          <div className="w-full">
            <div className="text-center mb-12 space-y-4">
              <h2 className="text-5xl font-bold tracking-tight text-white animate-fade-in-up opacity-0">
                精准切分图片
              </h2>
              <p className="text-muted-foreground text-lg max-w-lg mx-auto animate-fade-in-up opacity-0 delay-100">
                上传您的精灵图或九宫格图片，自由调整切割线，几秒钟内即可生成并下载独立的切片资源。
              </p>
            </div>
            <div className="animate-fade-in-up opacity-0 delay-200">
              <FileUpload onFileSelect={handleFileSelect} />
            </div>
          </div>
        )}

        {step === 'edit' && imageSrc && (
          <div className="w-full h-full flex flex-col items-center animate-accordion-down">
            {isProcessing ? (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-lg text-muted-foreground animate-pulse">正在切图...</p>
                </div>
            ) : (
                <GridEditor 
                    imageSrc={imageSrc} 
                    config={config}
                    onChangeConfig={setConfig}
                    onGenerate={handleGenerate}
                    onBack={() => setStep('upload')}
                />
            )}
          </div>
        )}

        {step === 'result' && (
          <div className="w-full h-full animate-accordion-down">
            <ResultGallery 
                slices={slices} 
                onBack={() => setStep('edit')} 
                onUpdateSlice={handleSliceUpdate}
                onSetSlices={handleSetSlices}
            />
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground/60 bg-gradient-to-t from-secondary/20 to-transparent">
        <p>&copy; {new Date().getFullYear()} SliceMeow 切图喵. 所有图片处理均在您的浏览器本地进行，安全无忧。</p>
      </footer>
    </div>
  );
};

export default App;