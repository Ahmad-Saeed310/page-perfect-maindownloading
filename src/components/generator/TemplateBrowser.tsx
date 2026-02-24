import { useState, useMemo, useRef } from 'react';
import { TEMPLATES, TEMPLATE_CATEGORIES, Template, searchTemplates } from '@/lib/templateCategories';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { TemplatePreview } from './TemplatePreview';
import {
  Search,
  File,
  Square,
  LayoutGrid,
  BookOpen,
  AlignLeft,
  Grid3X3,
  Grip,
  Music,
  Ruler,
  NotebookPen,
  Calendar,
  PenTool,
  Box,
  Hexagon,
  Film,
  Triangle,
  CircleDot,
  TrendingUp,
  Target,
  Wallet,
  List,
  CalendarDays,
  GraduationCap,
  Gamepad2,
  Trophy,
  Scissors,
  Tag,
  Layout,
  ChevronLeft,
  ChevronRight,
  X,
  Octagon,
  Pentagon,
  Move3D,
  Guitar,
  Palette,
  Network,
  Layers,
  Columns2,
  Columns3,
  Table,
  CalendarRange,
  CheckSquare,
  Utensils,
  Apple,
  Dumbbell,
  GanttChart,
  CreditCard,
  Receipt,
  PiggyBank,
  ListChecks,
  ShoppingCart,
  Luggage,
  Star,
  Contact,
  Package,
  CalendarClock,
  Clock,
  Users,
  FileText,
  ClipboardList,
  FileQuestion,
  Hash,
  Route,
  Circle,
  Diamond,
  RectangleHorizontal,
  GitBranch,
  Flag,
  Mail,
  Badge,
  BookCopy,
  Monitor,
  Smartphone,
  Crosshair,
  User,
  StickyNote,
  PenLine,
  AlignJustify,
  ChartLine,
  ChartSpline,
  LayoutPanelLeft,
  ListTree,
  Cylinder,
  SpellCheck,
} from 'lucide-react';

interface TemplateBrowserProps {
  value: string;
  onChange: (template: Template) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'file': File,
  'square': Square,
  'layout-grid': LayoutGrid,
  'book-open': BookOpen,
  'align-left': AlignLeft,
  'grid-3x3': Grid3X3,
  'grip': Grip,
  'music': Music,
  'ruler': Ruler,
  'notebook': NotebookPen,
  'notebook-pen': NotebookPen,
  'calendar': Calendar,
  'pen-tool': PenTool,
  'box': Box,
  'hexagon': Hexagon,
  'film': Film,
  'triangle': Triangle,
  'circle-dot': CircleDot,
  'trending-up': TrendingUp,
  'chart-line': ChartLine,
  'chart-spline': ChartSpline,
  'move-3d': Move3D,
  'target': Target,
  'wallet': Wallet,
  'list': List,
  'calendar-days': CalendarDays,
  'graduation-cap': GraduationCap,
  'gamepad-2': Gamepad2,
  'trophy': Trophy,
  'scissors': Scissors,
  'tag': Tag,
  'layout': Layout,
  'octagon': Octagon,
  'pentagon': Pentagon,
  'guitar': Guitar,
  'piano': Music,
  'palette': Palette,
  'layout-panel-left': LayoutPanelLeft,
  'list-tree': ListTree,
  'network': Network,
  'layers': Layers,
  'columns-2': Columns2,
  'columns-3': Columns3,
  'table': Table,
  'calendar-range': CalendarRange,
  'check-square': CheckSquare,
  'utensils': Utensils,
  'apple': Apple,
  'dumbbell': Dumbbell,
  'gantt-chart': GanttChart,
  'credit-card': CreditCard,
  'receipt': Receipt,
  'piggy-bank': PiggyBank,
  'trending-down': TrendingUp,
  'file-text': FileText,
  'book': BookOpen,
  'list-checks': ListChecks,
  'shopping-cart': ShoppingCart,
  'luggage': Luggage,
  'star': Star,
  'contact': Contact,
  'package': Package,
  'calendar-clock': CalendarClock,
  'clock': Clock,
  'users': Users,
  'clipboard-list': ClipboardList,
  'file-question': FileQuestion,
  'spell-check': SpellCheck,
  'search': Search,
  'hash': Hash,
  'route': Route,
  'circle': Circle,
  'diamond': Diamond,
  'rectangle-horizontal': RectangleHorizontal,
  'git-branch': GitBranch,
  'flag': Flag,
  'mail': Mail,
  'badge': Badge,
  'book-copy': BookCopy,
  'monitor': Monitor,
  'smartphone': Smartphone,
  'cylinder': Cylinder,
  'semicircle': Circle,
  'crosshair': Crosshair,
  'user': User,
  'sticky-note': StickyNote,
  'pen-line': PenLine,
  'align-justify': AlignJustify,
  'grid-2x2': Grid3X3,
  'axis-3d': Move3D,
};

const categoryIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'basic': File,
  'graph': Grid3X3,
  'specialty-graph': Triangle,
  'music-art': Music,
  'notes-study': BookOpen,
  'planners': Calendar,
  'budgets': Wallet,
  'lists': List,
  'calendars': CalendarDays,
  'teacher': GraduationCap,
  'games': Gamepad2,
  'sports': Trophy,
  'crafts': Scissors,
  'cards-tags': Tag,
  'marketing': Layout,
  '3d-technical': Box,
  'targets': Target,
};

export function TemplateBrowser({ value, onChange, isOpen, onToggle }: TemplateBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const tabsRef = useRef<HTMLDivElement>(null);

  const filteredTemplates = useMemo(() => {
    let results = searchQuery ? searchTemplates(searchQuery) : TEMPLATES;
    if (selectedCategory !== 'all') {
      results = results.filter(t => t.category === selectedCategory);
    }
    return results;
  }, [searchQuery, selectedCategory]);

  const selectedTemplate = TEMPLATES.find(t => t.id === value);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({ left: direction === 'left' ? -160 : 160, behavior: 'smooth' });
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 rounded-l-none shadow-lg h-20 px-1"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <div className="fixed left-0 top-0 h-full w-72 sm:w-80 bg-card border-r border-border shadow-xl z-40 flex flex-col ">

      {/* Header */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground text-sm">Templates</h2>
          <Button variant="ghost" size="icon" onClick={onToggle} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
      </div>

      {/* Category Tab Bar */}
      <div className="border-b border-border bg-muted/20 relative flex items-center">
        {/* Left scroll arrow */}
        <button
          onClick={() => scrollTabs('left')}
          className="shrink-0 h-full px-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Scrollable tabs */}
        <div
          ref={tabsRef}
          className="flex overflow-x-auto scrollbar-none gap-0.5 py-1.5 px-0.5 flex-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* All tab */}
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 min-w-[52px]',
              selectedCategory === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="leading-none">All</span>
          </button>

          {/* Category tabs */}
          {TEMPLATE_CATEGORIES.map(cat => {
            const CatIcon = categoryIconMap[cat.id] || File;
            const isActive = selectedCategory === cat.id;
            // Shorten long category names for tab display
            const shortName = cat.name
              .replace(' & ', '/')
              .replace('Specialty ', '')
              .replace(' Resources', '')
              .replace(' & Activities', '')
              .replace(' & Recreation', '')
              .replace(' & Hobbies', '')
              .replace(' & Finance', '')
              .replace(' & Organizers', '')
              .replace(' & Tags', '')
              .replace(' & Design', '')
              .replace(' & Technical', '');

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  'shrink-0 flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150 min-w-[52px]',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}
                title={cat.name}
              >
                <CatIcon className="w-3.5 h-3.5" />
                <span className="leading-none truncate max-w-[60px] text-center">{shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Right scroll arrow */}
        <button
          onClick={() => scrollTabs('right')}
          className="shrink-0 h-full px-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Active category label */}
      <div className="px-3 py-1.5 bg-muted/10 border-b border-border/50">
        <p className="text-xs text-muted-foreground">
          {selectedCategory === 'all'
            ? `All templates · ${filteredTemplates.length}`
            : `${TEMPLATE_CATEGORIES.find(c => c.id === selectedCategory)?.name ?? ''} · ${filteredTemplates.length}`}
          {searchQuery && ` · "${searchQuery}"`}
        </p>
      </div>

      {/* Template Grid */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Search className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No templates found</p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mt-2 text-xs text-primary underline underline-offset-2"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredTemplates.map(template => {
                const isSelected = value === template.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => onChange(template)}
                    className={cn(
                      'w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all duration-200',
                      isSelected
                        ? 'bg-primary/10 text-primary border-2 border-primary/40 shadow-sm'
                        : 'hover:bg-muted/60 border-2 border-transparent hover:border-border'
                    )}
                  >
                    <TemplatePreview templateId={template.id} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm font-medium truncate', isSelected ? 'text-primary' : 'text-foreground')}>
                        {template.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Selected Template Info */}
      {selectedTemplate && (
        <div className="p-3 border-t border-border bg-muted/30">
          <div className="flex items-center gap-2">
            {(() => {
              const Icon = iconMap[selectedTemplate.icon] || File;
              return <Icon className="w-5 h-5 text-primary" />;
            })()}
            <div>
              <p className="text-sm font-medium text-foreground">{selectedTemplate.name}</p>
              <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
