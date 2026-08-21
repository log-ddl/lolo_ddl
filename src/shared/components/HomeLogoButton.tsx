import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

interface HomeLogoButtonProps {
  onClick: () => void;
  label: string;
  mark: string;
}

export function HomeLogoButton({ onClick, label, mark }: HomeLogoButtonProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className="w-8 h-8 flex items-center justify-center mx-auto rounded-lg bg-primary text-primary-foreground shadow-sm transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          >
            <span className="text-xs font-bold tracking-tight">{mark}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
