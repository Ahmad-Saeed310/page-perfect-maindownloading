import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  X, Maximize2, Minimize2, PenLine, Save,
  Download, AlignJustify, FileText, Image, File, FileType2, ChevronDown,
} from 'lucide-react';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FocusMode({ isOpen, onClose }: FocusModeProps) {
  const [text, setText] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showLines, setShowLines] = useState(() => {
    return localStorage.getItem('blankpage-focus-lines') === 'true';
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('blankpage-focus-text');
    if (saved) setText(saved);
  }, []);

  // Save to localStorage with debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem('blankpage-focus-text', text);
      setLastSaved(new Date());
    }, 500);
    return () => clearTimeout(timeout);
  }, [text]);

  // Persist lines preference
  useEffect(() => {
    localStorage.setItem('blankpage-focus-lines', String(showLines));
  }, [showLines]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // ── Shared helpers ─────────────────────────────────────────────────────────
  const filename = (ext: string) =>
    `focus-mode-${new Date().toISOString().slice(0, 10)}.${ext}`;

  const blobDownload = (content: string | Blob, mime: string, ext: string) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename(ext);
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineCSS = showLines
    ? `background-image:repeating-linear-gradient(to bottom,transparent 0px,transparent 28px,#c8c5bf 28px,#c8c5bf 29px);background-attachment:local;`
    : '';

  const escapedHtml = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  // ── Download: HTML ─────────────────────────────────────────────────────────
  const downloadHTML = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Focus Mode – ${new Date().toLocaleDateString()}</title>
  <style>
    body{margin:0;padding:2rem;background:#f5f5f4;font-family:'Inter',system-ui,sans-serif;}
    .page{max-width:800px;margin:0 auto;padding:3rem;min-height:100vh;
          font-size:1.125rem;line-height:1.625;white-space:pre-wrap;word-wrap:break-word;${lineCSS}}
  </style>
</head>
<body><div class="page">${escapedHtml}</div></body>
</html>`;
    blobDownload(html, 'text/html', 'html');
  };

  // ── Download: Plain Text ───────────────────────────────────────────────────
  const downloadTXT = () => {
    blobDownload(text, 'text/plain', 'txt');
  };

  // ── Download: PDF via jsPDF ────────────────────────────────────────────────
  const downloadPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const margin = 20;
    const lh = 8;

    const drawPageLines = () => {
      if (!showLines) return;
      doc.setDrawColor(200, 197, 191);
      doc.setLineWidth(0.3);
      for (let y = margin + lh; y < ph - margin; y += lh) {
        doc.line(margin, y, pw - margin, y);
      }
    };

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(text || ' ', pw - margin * 2);

    drawPageLines();
    doc.setTextColor(28, 25, 23);
    let y = margin + lh;
    for (const line of lines) {
      if (y > ph - margin) {
        doc.addPage();
        drawPageLines();
        y = margin + lh;
      }
      doc.text(line, margin, y);
      y += lh;
    }
    doc.save(filename('pdf'));
  };

  // ── Download: JPEG via Canvas ──────────────────────────────────────────────
  const downloadJPEG = () => {
    const canvas = document.createElement('canvas');
    const pad = 60;
    const canvasWidth = 1000;
    const fontSize = 20;
    const lh = 32;

    // Measure & wrap text
    const ctx = canvas.getContext('2d')!;
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    const maxW = canvasWidth - pad * 2;
    const wrapped: string[] = [];
    for (const rawLine of text.split('\n')) {
      if (!rawLine) { wrapped.push(''); continue; }
      let cur = '';
      for (const word of rawLine.split(' ')) {
        const test = cur ? `${cur} ${word}` : word;
        if (ctx.measureText(test).width > maxW) {
          if (cur) wrapped.push(cur);
          cur = word;
        } else cur = test;
      }
      if (cur) wrapped.push(cur);
    }
    if (!wrapped.length) wrapped.push('');

    canvas.width = canvasWidth;
    canvas.height = Math.max(pad * 2 + wrapped.length * lh + lh, 500);

    // Background
    ctx.fillStyle = '#f5f5f4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ruled lines
    if (showLines) {
      ctx.strokeStyle = '#c8c5bf';
      ctx.lineWidth = 1;
      for (let y = pad + lh; y < canvas.height - pad; y += lh) {
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(canvas.width - pad, y);
        ctx.stroke();
      }
    }

    // Text
    ctx.fillStyle = '#1c1917';
    ctx.font = `${fontSize}px Inter, system-ui, sans-serif`;
    wrapped.forEach((line, i) => {
      ctx.fillText(line, pad, pad + (i + 1) * lh);
    });

    const url = canvas.toDataURL('image/jpeg', 0.95);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename('jpg');
    a.click();
  };

  // ── Download: Word (.doc) ──────────────────────────────────────────────────
  const downloadDOC = () => {
    const wordLineStyle = showLines
      ? `background-image:repeating-linear-gradient(to bottom,transparent 0px,transparent 28px,#c8c5bf 28px,#c8c5bf 29px);`
      : '';
    const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office'
  xmlns:w='urn:schemas-microsoft-com:office:word'
  xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>Focus Mode</title>
  <style>
    @page{margin:2.5cm;}
    body{font-family:Calibri,Arial,sans-serif;font-size:12pt;line-height:1.625;}
    .page{white-space:pre-wrap;word-wrap:break-word;${wordLineStyle}}
  </style>
</head>
<body><div class="page">${escapedHtml}</div></body>
</html>`;
    blobDownload(html, 'application/msword', 'doc');
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const charCount = text.length;

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 bg-stone-100 transition-all duration-300 ${
        isFullscreen ? 'p-0' : 'p-4 md:p-8 w-full h-full'
      }`}
    >
      <div className={`h-full flex flex-col ${isFullscreen ? '' : 'max-w-full max-h-full mx-auto'}`}>

        {/* Toolbar */}
        <div className="flex justify-between items-center mb-4 px-4 py-2 bg-stone-100 rounded-lg border border-border/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-primary">
              <PenLine className="w-5 h-5" />
              <span className="font-semibold text-sm hidden sm:inline">Focus Mode</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="text-xs text-muted-foreground space-x-3">
              <span className="font-medium">{wordCount} words</span>
              <span>{charCount} chars</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lastSaved && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
                <Save className="w-3 h-3" />
                <span className="hidden sm:inline">Saved</span>
              </div>
            )}

            {/* Lines toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLines(!showLines)}
              title={showLines ? 'Hide lines' : 'Show lines'}
              className={`h-8 w-8 p-0 ${showLines ? 'bg-muted text-foreground' : ''}`}
            >
              <AlignJustify className="w-4 h-4" />
            </Button>

            {/* Download dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Download"
                  className="h-8 px-2 gap-1 flex items-center"
                >
                  <Download className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={downloadPDF} className="gap-2 cursor-pointer">
                  <FileText className="w-4 h-4 text-red-500" />
                  <span>PDF</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadJPEG} className="gap-2 cursor-pointer">
                  <Image className="w-4 h-4 text-blue-500" />
                  <span>JPEG Image</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={downloadDOC} className="gap-2 cursor-pointer">
                  <FileType2 className="w-4 h-4 text-sky-600" />
                  <span>Word (.doc)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadTXT} className="gap-2 cursor-pointer">
                  <File className="w-4 h-4 text-muted-foreground" />
                  <span>Plain Text</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={downloadHTML} className="gap-2 cursor-pointer">
                  <FileText className="w-4 h-4 text-orange-500" />
                  <span>HTML Page</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 p-0"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            {/* Close */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Writing area */}
        <div className="flex-1 overflow-hidden rounded-lg border border-border/30 w-full h-full">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start writing... Let your thoughts flow freely."
            autoFocus
            className="w-full h-full resize-none bg-stone-100 border-none outline-none text-lg leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:ring-0 p-6 md:p-8"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              backgroundImage: showLines
                ? 'repeating-linear-gradient(to bottom, transparent 0px, transparent 28px, #c8c5bf 28px, #c8c5bf 29px)'
                : 'none',
              backgroundAttachment: 'local',
            }}
          />
        </div>

        {/* Footer */}
        <div className="text-center py-3">
          <div className="inline-flex items-center gap-4 text-xs text-muted-foreground/50">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">Esc</kbd>
              to exit
            </span>
            <span>•</span>
            <span>Auto-saved locally</span>
          </div>
        </div>
      </div>
    </div>
  );
}
