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
  Share2, Mail, MessageCircle, Copy, Check,
} from 'lucide-react';
import { toast } from 'sonner';

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
  const [copied, setCopied] = useState(false);

  const shareUrl = window.location.href;
  const shareText = 'Check out this free printable page tool!';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const openShare = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

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

  const SITE_URL = 'allprintablepages.com';

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
    .footer{text-align:center;padding:1.5rem 0 0.5rem;color:#a8a29e;font-size:0.75rem;}
    .footer a{color:inherit;text-decoration:none;}
  </style>
</head>
<body>
  <div class="page">${escapedHtml}</div>
  <div class="footer"><a href="https://${SITE_URL}">${SITE_URL}</a></div>
</body>
</html>`;
    blobDownload(html, 'text/html', 'html');
  };

  // ── Download: Plain Text ───────────────────────────────────────────────────
  const downloadTXT = () => {
    blobDownload(`${text}\n\n${SITE_URL}`, 'text/plain', 'txt');
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

    const drawFooter = () => {
      doc.setFontSize(8);
      doc.setTextColor(168, 162, 158);
      const tw = doc.getTextWidth(SITE_URL);
      doc.textWithLink(SITE_URL, pw / 2 - tw / 2, ph - 8, { url: `https://${SITE_URL}` });
    };

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(text || ' ', pw - margin * 2);

    drawPageLines();
    doc.setTextColor(28, 25, 23);
    let y = margin + lh;
    for (const line of lines) {
      if (y > ph - margin) {
        drawFooter();
        doc.addPage();
        drawPageLines();
        y = margin + lh;
      }
      doc.text(line, margin, y);
      y += lh;
    }
    drawFooter();
    doc.save(filename('pdf'));
  };

  // ── Download: JPEG via Canvas ──────────────────────────────────────────────
  const downloadJPEG = () => {
    const canvas = document.createElement('canvas');
    const pad = 60;
    const footerH = 40;
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
    canvas.height = Math.max(pad * 2 + wrapped.length * lh + lh + footerH, 500);

    // Background
    ctx.fillStyle = '#f5f5f4';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ruled lines
    if (showLines) {
      ctx.strokeStyle = '#c8c5bf';
      ctx.lineWidth = 1;
      for (let y = pad + lh; y < canvas.height - pad - footerH; y += lh) {
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

    // Footer link
    ctx.font = '14px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(168,162,158,0.8)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(SITE_URL, canvas.width / 2, canvas.height - footerH / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

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
    .footer{text-align:center;color:#a8a29e;font-size:8pt;margin-top:2em;}
  </style>
</head>
<body>
  <div class="page">${escapedHtml}</div>
  <div class="footer">${SITE_URL}</div>
</body>
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

            {/* Share dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  title="Share"
                  className="h-8 px-2 gap-1 flex items-center"
                >
                  <Share2 className="w-4 h-4" />
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`)} className="gap-2 cursor-pointer">
                  <span className="w-4 h-4 flex items-center justify-center text-[#1877F2] font-bold text-sm">f</span>
                  <span>Facebook</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openShare(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`)} className="gap-2 cursor-pointer">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>WhatsApp</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openShare(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`)} className="gap-2 cursor-pointer">
                  <span className="w-4 h-4 flex items-center justify-center font-bold text-xs">𝕏</span>
                  <span>X / Twitter</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openShare(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareText)}`)} className="gap-2 cursor-pointer">
                  <span className="w-4 h-4 flex items-center justify-center text-[#E60023] font-bold text-sm">P</span>
                  <span>Pinterest</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
                  <span className="w-4 h-4 flex items-center justify-center text-[#E1306C] font-bold text-xs">IG</span>
                  <span>Instagram (copy link)</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openShare(`mailto:?subject=${encodeURIComponent('Check out this printable page tool')}&body=${encodeURIComponent(shareText + '\n\n' + shareUrl)}`)} className="gap-2 cursor-pointer">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>Email</span>
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
        <div className="relative flex-1 overflow-hidden rounded-lg border border-border/30 w-full h-full">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Start writing... Let your thoughts flow freely."
            autoFocus
            className="w-full h-full resize-none bg-stone-100 border-none outline-none text-lg leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus:ring-0 p-6 md:p-8 pb-10"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              backgroundImage: showLines
                ? 'repeating-linear-gradient(to bottom, transparent 0px, transparent 28px, #c8c5bf 28px, #c8c5bf 29px)'
                : 'none',
              backgroundAttachment: 'local',
            }}
          />
          <a
            href="https://allprintablepages.com"
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-muted-foreground/40 hover:text-primary transition-colors blur-[0.5px] hover:blur-none pointer-events-auto select-none"
            style={{ textDecoration: 'none' }}
          >
            allprintablepages.com
          </a>
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
