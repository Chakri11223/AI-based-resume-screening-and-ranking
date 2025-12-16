import { LucideIcon } from "lucide-react";
import { Card } from "./ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  className?: string;
}

export const StatCard = ({ title, value, icon: Icon, trend, className }: StatCardProps) => {
  return (
    <Card className={cn("p-6 glass border-white/10 hover:shadow-glow transition-all duration-300", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
          {trend && (
            <p className="text-xs text-accent">{trend}</p>
          )}
        </div>
        <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </Card>
  );
};
