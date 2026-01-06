import { Button } from '@/components/ui/button';
import { Check, HelpCircle, X } from 'lucide-react';
import { RsvpStatus } from '@/hooks/useCoordinationThreads';
import { cn } from '@/lib/utils';

interface ThreadRsvpButtonsProps {
  currentStatus: RsvpStatus;
  onRsvp: (status: RsvpStatus) => void;
  compact?: boolean;
}

const rsvpOptions: { status: RsvpStatus; label: string; icon: React.ReactNode; activeClass: string }[] = [
  { 
    status: 'going', 
    label: 'Going', 
    icon: <Check className="h-4 w-4" />,
    activeClass: 'bg-green-500 text-white hover:bg-green-600 border-green-500'
  },
  { 
    status: 'maybe', 
    label: 'Maybe', 
    icon: <HelpCircle className="h-4 w-4" />,
    activeClass: 'bg-amber-500 text-white hover:bg-amber-600 border-amber-500'
  },
  { 
    status: 'declined', 
    label: "Can't go", 
    icon: <X className="h-4 w-4" />,
    activeClass: 'bg-muted text-muted-foreground border-muted'
  }
];

export function ThreadRsvpButtons({ currentStatus, onRsvp, compact = false }: ThreadRsvpButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-1">RSVP:</span>
      {rsvpOptions.map((option) => {
        const isActive = currentStatus === option.status;
        
        return (
          <Button
            key={option.status}
            variant="outline"
            size={compact ? "sm" : "default"}
            onClick={() => onRsvp(option.status)}
            className={cn(
              "transition-all",
              isActive && option.activeClass
            )}
          >
            {option.icon}
            {!compact && <span className="ml-1.5">{option.label}</span>}
          </Button>
        );
      })}
    </div>
  );
}
