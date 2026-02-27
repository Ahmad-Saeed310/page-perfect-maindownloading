import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { PAPER_SIZES, PaperSize, Orientation } from '@/lib/paperSizes';
import { TEMPLATES, Template } from '@/lib/templateCategories';
import { DEFAULT_CONFIGS, TemplateConfig, getTemplateConfig } from '@/lib/templateConfigs';
import { TextElement, CanvasImageData } from '@/lib/canvasTypes';
import { PageSizeSelector } from './PageSizeSelector';
import { TemplateBrowser } from './TemplateBrowser';
import { TemplatePreview } from './TemplatePreview';
import { CanvasPreview } from './CanvasPreview';
import { ExpandableNotepad } from './ExpandableNotepad';
import { ExportControls } from './ExportControls';
import { CustomizationPanel } from './CustomizationPanel';
import { ImageUploader } from './ImageUploader';
import { OrientationToggle } from './OrientationToggle';
import { FocusMode } from './FocusMode';
import { SaveLoadDesign, SavedDesign } from './SaveLoadDesign';
import { CollapsibleTextPanel } from './CollapsibleTextPanel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  FileText, PenLine, ChevronDown, ChevronUp, LayoutList,
  SlidersHorizontal, Palette, Type, Download, ChevronRight,
} from 'lucide-react';

// import GoogleAd from "../Ad/GoogleAd"
import AdBanner from '../Ad/AdBanner';

export function PageGenerator() {
  const [paperSize, setPaperSize] = useState<PaperSize>(
    PAPER_SIZES.find((s) => s.id === 'a4')!
  );
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [template, setTemplate] = useState<Template>(
    TEMPLATES.find((t) => t.id === 'lined')!
  );
  const [notepadText, setNotepadText] = useState('');
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [images, setImages] = useState<CanvasImageData[]>([]);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
  const [showOptions, setShowOptions] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'setup' | 'style' | 'content' | 'export' | null>('setup');
  
  // Undo/Redo state
  const historyRef = useRef<{ textElements: TextElement[]; images: CanvasImageData[] }[]>([]);
  const currentIndexRef = useRef(-1);
  const isUpdatingRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Save state to history
  const saveState = useCallback(() => {
    if (isUpdatingRef.current) return;
    
    const newState = {
      textElements: JSON.parse(JSON.stringify(textElements)),
      images: JSON.parse(JSON.stringify(images)),
    };
    
    historyRef.current = historyRef.current.slice(0, currentIndexRef.current + 1);
    historyRef.current.push(newState);
    
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
    } else {
      currentIndexRef.current++;
    }
    
    setCanUndo(currentIndexRef.current > 0);
    setCanRedo(false);
  }, [textElements, images]);

  // Save initial state
  useEffect(() => {
    if (historyRef.current.length === 0) {
      saveState();
    }
  }, []);

  // Save state on changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isUpdatingRef.current && historyRef.current.length > 0) {
        saveState();
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [textElements, images]);

  const handleUndo = useCallback(() => {
    if (currentIndexRef.current <= 0) return;
    
    currentIndexRef.current--;
    const state = historyRef.current[currentIndexRef.current];
    
    isUpdatingRef.current = true;
    setTextElements(state.textElements);
    setImages(state.images);
    setTimeout(() => { isUpdatingRef.current = false; }, 100);
    
    setCanUndo(currentIndexRef.current > 0);
    setCanRedo(true);
  }, []);

  const handleRedo = useCallback(() => {
    if (currentIndexRef.current >= historyRef.current.length - 1) return;
    
    currentIndexRef.current++;
    const state = historyRef.current[currentIndexRef.current];
    
    isUpdatingRef.current = true;
    setTextElements(state.textElements);
    setImages(state.images);
    setTimeout(() => { isUpdatingRef.current = false; }, 100);
    
    setCanUndo(true);
    setCanRedo(currentIndexRef.current < historyRef.current.length - 1);
  }, []);

  // Customization state
  const [lineColor, setLineColor] = useState(getTemplateConfig(template.id).lineColor);
  const [pageColor, setPageColor] = useState(getTemplateConfig(template.id).pageColor);
  const [lineGap, setLineGap] = useState(
    getTemplateConfig(template.id).lineSpacing || getTemplateConfig(template.id).gridSize || 5
  );

  const config: TemplateConfig = useMemo(() => {
    const baseConfig = getTemplateConfig(template.id);
    return {
      ...baseConfig,
      lineColor,
      pageColor,
      lineSpacing: baseConfig.lineSpacing > 0 ? lineGap : 0,
      gridSize: baseConfig.gridSize > 0 ? lineGap : 0,
    };
  }, [template.id, lineColor, pageColor, lineGap]);


  const handlePaperSizeChange = useCallback((size: PaperSize) => {
    setPaperSize(size);
  }, []);

  const handleTemplateChange = useCallback((t: Template) => {
    setTemplate(t);
    const defaults = getTemplateConfig(t.id);
    setLineColor(defaults.lineColor);
    setPageColor(defaults.pageColor);
    setLineGap(defaults.lineSpacing || defaults.gridSize || 5);
  }, []);

  const handleLoadDesign = useCallback((data: SavedDesign['data']) => {
    const loadedPaperSize = PAPER_SIZES.find(s => s.id === data.paperSizeId);
    const loadedTemplate = TEMPLATES.find(t => t.id === data.templateId);
    
    if (loadedPaperSize) setPaperSize(loadedPaperSize);
    if (loadedTemplate) setTemplate(loadedTemplate);
    if (data.orientation) setOrientation(data.orientation as Orientation);
    if (data.lineColor) setLineColor(data.lineColor);
    if (data.pageColor) setPageColor(data.pageColor);
    if (data.lineGap) setLineGap(data.lineGap);
    if (data.notepadText !== undefined) setNotepadText(data.notepadText);
    if (data.textElements) setTextElements(data.textElements);
    if (data.images) setImages(data.images);
  }, []);

  // Load shared design from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const designParam = params.get('design');
    if (designParam) {
      try {
        const design = JSON.parse(decodeURIComponent(designParam)) as SavedDesign['data'];
        handleLoadDesign(design);
        const url = new URL(window.location.href);
        url.searchParams.delete('design');
        window.history.replaceState({}, '', url.toString());
      } catch (e) {
        console.error('Failed to load shared design from URL:', e);
      }
    }
  }, []);

  const currentDesign: SavedDesign['data'] = useMemo(() => ({
    paperSizeId: paperSize.id,
    templateId: template.id,
    orientation,
    lineColor,
    pageColor,
    lineGap,
    notepadText,
    textElements,
    images,
  }), [paperSize.id, template.id, orientation, lineColor, pageColor, lineGap, notepadText, textElements, images]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Template Browser Sidebar */}
      <TemplateBrowser
        value={template.id}
        onChange={handleTemplateChange}
        isOpen={showTemplateBrowser}
        onToggle={() => setShowTemplateBrowser(!showTemplateBrowser)}
      />

      {/* Header - Compact on mobile */}
      <header className="bg-card border-b border-border shadow-toolbar sticky top-0 z-10 bg-emerald-800 backdrop-blur-sm">
        <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTemplateBrowser(!showTemplateBrowser)}
              className="gap-1.5 h-8 px-2 bg-white"
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline text-xs ">Templates</span>
            </Button>
            <div className="flex items-center gap-1.5 sm:gap-2 text-primary">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              <h1 className="text-sm sm:text-lg font-semibold text-foreground text-white">
                Page Generator
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <h3 className='text-white'>Blank Page</h3>
            <div className="h-4 w-px bg-border md:hidden" />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFocusMode(true)}
              className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/30 hover:from-primary/10 hover:to-primary/20"
            >
              <PenLine className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
              <span className="hidden xs:inline text-xs sm:text-sm font-medium">Focus Mode</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4 flex-1   ">
        {/* Mobile: Page preview on top */}
        <div className="flex flex-col gap-3 sm:gap-4">
          {/* Canvas Preview - Always visible at top on mobile, side on desktop */}
          <div className="lg:hidden">
             <AdBanner adSlot="4048800768" width={728} height={90} />
            <CanvasPreview
              paperSize={paperSize}
              templateId={template.id}
              templateName={template.name}
              config={config}
              orientation={orientation}
              notepadText={notepadText}
              textElements={textElements}
              onTextElementsChange={setTextElements}
              images={images}
              onImagesChange={setImages}
              onUndo={handleUndo}
              onRedo={handleRedo}
              canUndo={canUndo}
              canRedo={canRedo}
            />

            {/* Collapsible Options on mobile */}
            <Button
              variant="outline"
              className="w-full mt-3 sm:mt-4 gap-2 h-10"
              onClick={() => setShowOptions(!showOptions)}
            >
              {showOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showOptions ? 'Hide Options' : 'Show Options'}
            </Button>
          </div>

          {/* Desktop layout: Side by side */}
          <div className={cn('hidden lg:grid gap-6  transition-all duration-300', sidebarTab !== null ? 'lg:grid-cols-[1fr_320px]' : 'lg:grid-cols-[1fr_52px]')}>
            {/* Canvas Preview Area - Left side on desktop */}
            <main className="flex flex-col items-center">

{/* <div className="w-full my-6">
              <GoogleAd key="desktop-ad" />
            </div> */}
<AdBanner adSlot="4048800768" width={728} height={90} />
              <CanvasPreview
                paperSize={paperSize}
                templateId={template.id}
                templateName={template.name}
                config={config}
                orientation={orientation}
                notepadText={notepadText}
                textElements={textElements}
                onTextElementsChange={setTextElements}
                images={images}
                onImagesChange={setImages}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
              />
            </main>

            {/* Sidebar Controls - Right side on desktop */}
            <aside className="bg-card rounded-xl border border-border sticky top-20 flex flex-row max-h-[calc(100vh-100px)] overflow-hidden ">
              {/* Content panel — visible when a tab is active */}
              {sidebarTab !== null && (
                <ScrollArea className="flex-1 border-r border-border">
                  <div className="p-3 space-y-3">
                    {sidebarTab === 'setup' && (
                      <>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">Template</p>
                          <button
                            onClick={() => setShowTemplateBrowser(!showTemplateBrowser)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-muted/40 transition-all duration-150 text-left group"
                          >
                            <TemplatePreview templateId={template.id} size={38} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{template.name}</p>
                              <p className="text-xs text-muted-foreground truncate capitalize">
                                {template.category.replace(/-/g, ' ')}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                          </button>
                        </div>
                        <PageSizeSelector value={paperSize.id} onChange={handlePaperSizeChange} />
                        <OrientationToggle value={orientation} onChange={setOrientation} />
                        <SaveLoadDesign currentDesign={currentDesign} onLoad={handleLoadDesign} />
                      </>
                    )}
                    {sidebarTab === 'style' && (
                      <CustomizationPanel
                        templateId={template.id}
                        lineColor={lineColor}
                        pageColor={pageColor}
                        lineGap={lineGap}
                        onLineColorChange={setLineColor}
                        onPageColorChange={setPageColor}
                        onLineGapChange={setLineGap}
                      />
                    )}
                    {sidebarTab === 'content' && (
                      <>
                        <CollapsibleTextPanel textElements={textElements} onTextElementsChange={setTextElements} />
                        <ExpandableNotepad value={notepadText} onChange={setNotepadText} />
                        <ImageUploader images={images} onImagesChange={setImages} />
                      </>
                    )}
                    {sidebarTab === 'export' && (
                      <ExportControls
                        paperSize={paperSize}
                        templateId={template.id}
                        config={config}
                        notepadText={notepadText}
                        textElements={textElements}
                        images={images}
                        orientation={orientation}
                      />
                    )}
                  </div>
                </ScrollArea>
              )}

              {/* Vertical tab strip — always visible on right edge */}
              <div className="flex flex-col shrink-0 w-[52px]">
                {(
                  [
                    { id: 'setup',   icon: SlidersHorizontal, label: 'Setup'   },
                    { id: 'style',   icon: Palette,            label: 'Style'   },
                    { id: 'content', icon: Type,               label: 'Content' },
                    { id: 'export',  icon: Download,           label: 'Export'  },
                  ] as const
                ).map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setSidebarTab(sidebarTab === id ? null : id)}
                    title={label}
                    className={cn(
                      'flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-all duration-150 border-l-2',
                      sidebarTab === id
                        ? 'border-l-primary text-primary bg-primary/5'
                        : 'border-l-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="leading-none">{label}</span>
                  </button>
                ))}
              </div>
            </aside>
          </div>

          {/* Mobile Options Panel */}
          {showOptions && (
            <div className="lg:hidden bg-card rounded-lg sm:rounded-xl border border-border overflow-hidden flex flex-row">
              {/* Content panel */}
              {sidebarTab !== null && (
                <div className="flex-1 p-3 space-y-3 border-r border-border overflow-y-auto max-h-[70vh]">
                  {sidebarTab === 'setup' && (
                    <>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1.5">Template</p>
                        <button
                          onClick={() => setShowTemplateBrowser(!showTemplateBrowser)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-muted/40 transition-all duration-150 text-left group"
                        >
                          <TemplatePreview templateId={template.id} size={38} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{template.name}</p>
                            <p className="text-xs text-muted-foreground truncate capitalize">
                              {template.category.replace(/-/g, ' ')}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                        </button>
                      </div>
                      <PageSizeSelector value={paperSize.id} onChange={handlePaperSizeChange} />
                      <OrientationToggle value={orientation} onChange={setOrientation} />
                      <SaveLoadDesign currentDesign={currentDesign} onLoad={handleLoadDesign} />
                    </>
                  )}
                  {sidebarTab === 'style' && (
                    <CustomizationPanel
                      templateId={template.id}
                      lineColor={lineColor}
                      pageColor={pageColor}
                      lineGap={lineGap}
                      onLineColorChange={setLineColor}
                      onPageColorChange={setPageColor}
                      onLineGapChange={setLineGap}
                    />
                  )}
                  {sidebarTab === 'content' && (
                    <>
                      <CollapsibleTextPanel textElements={textElements} onTextElementsChange={setTextElements} />
                      <ExpandableNotepad value={notepadText} onChange={setNotepadText} />
                      <ImageUploader images={images} onImagesChange={setImages} />
                    </>
                  )}
                  {sidebarTab === 'export' && (
                    <ExportControls
                      paperSize={paperSize}
                      templateId={template.id}
                      config={config}
                      notepadText={notepadText}
                      textElements={textElements}
                      images={images}
                      orientation={orientation}
                      currentDesign={currentDesign}
                    />
                  )}
                </div>
              )}

              {/* Vertical tab strip */}
              <div className="flex flex-col shrink-0 w-[52px]">
                {(
                  [
                    { id: 'setup',   icon: SlidersHorizontal, label: 'Setup'   },
                    { id: 'style',   icon: Palette,            label: 'Style'   },
                    { id: 'content', icon: Type,               label: 'Content' },
                    { id: 'export',  icon: Download,           label: 'Export'  },
                  ] as const
                ).map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setSidebarTab(sidebarTab === id ? null : id)}
                    title={label}
                    className={cn(
                      'flex flex-col items-center gap-1 py-3 text-[10px] font-medium transition-all duration-150 border-l-2',
                      sidebarTab === id
                        ? 'border-l-primary text-primary bg-primary/5'
                        : 'border-l-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="leading-none">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <FocusMode isOpen={showFocusMode} onClose={() => setShowFocusMode(false)} />
    </div>
  );
}
