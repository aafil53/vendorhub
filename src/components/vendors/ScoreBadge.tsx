import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ScoreBreakdown {
  bidAcceptance:   { pts: number; max: number; pct: number | null };
  poCompletion:    { pts: number; max: number; pct: number | null };
  responseRate:    { pts: number; max: number; pct: number | null };
  experienceBonus: { pts: number; max: number; years: number };
}

export interface VendorScore {
  vendorId:   number;
  score:      number;
  grade:      string;
  gradeLabel: string;
  gradeColor: string;
  breakdown:  ScoreBreakdown;
}

interface ScoreBadgeProps {
  score: VendorScore;
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
  className?: string;
}

const SIZE = {
  sm: { badge: 'h-7 w-7 text-xs',   bar: 'h-1',    text: 'text-xs' },
  md: { badge: 'h-9 w-9 text-sm',   bar: 'h-1.5',  text: 'text-sm' },
  lg: { badge: 'h-12 w-12 text-base', bar: 'h-2',  text: 'text-sm' },
};

const BREAKDOWN_ITEMS = [
  { key: 'bidAcceptance',   label: 'Bid Acceptance', suffix: (b: any) => b.pct != null ? `${b.pct}%` : 'No data' },
  { key: 'poCompletion',    label: 'PO Completion',  suffix: (b: any) => b.pct != null ? `${b.pct}%` : 'No data' },
  { key: 'responseRate',    label: 'Response Rate',  suffix: (b: any) => b.pct != null ? `${b.pct}%` : 'No data' },
  { key: 'experienceBonus', label: 'Experience',     suffix: (b: any) => `${b.years} yrs` },
];

export function ScoreBadge({ score, size = 'md', showBreakdown = true, className }: ScoreBadgeProps) {
  const s = SIZE[size];

  const badge = (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg font-black shrink-0 border-2 cursor-default select-none',
        s.badge,
        className
      )}
      style={{
        backgroundColor: score.gradeColor + '18',
        borderColor:     score.gradeColor + '40',
        color:           score.gradeColor,
      }}
    >
      {score.grade}
    </div>
  );

  if (!showBreakdown) return badge;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent
          side="left"
          className="w-64 p-0 border border-gray-100 shadow-xl rounded-xl overflow-hidden bg-white"
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between"
            style={{ backgroundColor: score.gradeColor + '12' }}
          >
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Performance Score</p>
              <p className="text-2xl font-black text-gray-900 leading-none mt-0.5">
                {score.score}
                <span className="text-sm font-semibold text-gray-400">/100</span>
              </p>
            </div>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-black border-2"
              style={{ backgroundColor: score.gradeColor + '18', borderColor: score.gradeColor + '40', color: score.gradeColor }}
            >
              {score.grade}
            </div>
          </div>

          {/* Breakdown bars */}
          <div className="px-4 py-3 space-y-2.5">
            {BREAKDOWN_ITEMS.map(item => {
              const b = score.breakdown[item.key as keyof ScoreBreakdown] as any;
              const pct = Math.round((b.pts / b.max) * 100);
              return (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-gray-600">{item.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-gray-400">{item.suffix(b)}</span>
                      <span className="text-[11px] font-bold text-gray-700">{b.pts}/{b.max}</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: score.gradeColor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-50 bg-gray-50/50">
            <p className="text-[10px] text-gray-400 text-center">
              Score computed from live bid, order & RFQ data
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ── Compact inline score pill (for tables) ───────────────────────────────────
export function ScorePill({ score, className }: { score: VendorScore; className?: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold cursor-default select-none border',
              className
            )}
            style={{
              backgroundColor: score.gradeColor + '15',
              borderColor:     score.gradeColor + '30',
              color:           score.gradeColor,
            }}
          >
            <span className="font-black">{score.grade}</span>
            <span className="font-semibold opacity-80">{score.score}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="p-0 border-none shadow-none">
          <ScoreBadge score={score} size="lg" />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
