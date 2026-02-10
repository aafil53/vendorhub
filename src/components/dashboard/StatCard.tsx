import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'warning' | 'success';
}

export function StatCard({ title, value, subtitle, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className={cn(
      "relative group overflow-hidden rounded-2xl glass p-6 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10",
      variant === 'warning' && "ring-1 ring-warning/30 bg-warning/5",
      variant === 'success' && "ring-1 ring-success/30 bg-success/5"
    )}>
      {/* Background Glow */}
      <div className={cn(
        "absolute -right-4 -top-4 w-24 h-24 blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 rounded-full",
        variant === 'warning' ? "bg-warning" : variant === 'success' ? "bg-success" : "bg-primary"
      )} />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-widest font-extrabold text-muted-foreground/60">{title}</p>
          <p className={cn(
            "mt-3 text-4xl font-black tracking-tighter leading-none",
            variant === 'warning' ? "text-warning" : variant === 'success' ? "text-success" : "text-foreground"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="mt-2 text-xs font-semibold text-muted-foreground/60">{subtitle}</p>
          )}
          {trend && (
            <div className={cn(
              "mt-4 flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded-full w-fit",
              trend.isPositive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            )}>
              <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
              <span className="opacity-60 text-[10px]">vs prev</span>
            </div>
          )}
        </div>
        <div className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-lg",
          variant === 'warning' ? "bg-warning/20 text-warning shadow-warning/10" : 
          variant === 'success' ? "bg-success/20 text-success shadow-success/10" : 
          "bg-primary/20 text-primary shadow-primary/10"
        )}>
          <Icon className="h-7 w-7" />
        </div>
      </div>
    </div>
  );
}

