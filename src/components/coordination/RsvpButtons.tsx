import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, HelpCircle, X, Loader2, Users } from 'lucide-react';
import { useActivityRsvp, RsvpStatus, RsvpSummary } from '@/hooks/useActivityRsvp';
import { cn } from '@/lib/utils';

interface RsvpButtonsProps {
  activityShareId: string;
  showSummary?: boolean;
  compact?: boolean;
  onRsvpChange?: (status: RsvpStatus | null) => void;
}

export const RsvpButtons: React.FC<RsvpButtonsProps> = ({
  activityShareId,
  showSummary = false,
  compact = false,
  onRsvpChange
}) => {
  const { loading, getUserRsvp, setRsvp, getRsvpSummary } = useActivityRsvp();
  const [currentStatus, setCurrentStatus] = useState<RsvpStatus | null>(null);
  const [summary, setSummary] = useState<RsvpSummary | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadRsvpData = async () => {
      setInitialLoading(true);
      const [rsvp, summaryData] = await Promise.all([
        getUserRsvp(activityShareId),
        showSummary ? getRsvpSummary(activityShareId) : Promise.resolve(null)
      ]);
      
      setCurrentStatus(rsvp?.status || null);
      if (summaryData) setSummary(summaryData);
      setInitialLoading(false);
    };

    loadRsvpData();
  }, [activityShareId, showSummary, getUserRsvp, getRsvpSummary]);

  const handleRsvp = async (status: RsvpStatus) => {
    const { success } = await setRsvp(activityShareId, status);
    if (success) {
      setCurrentStatus(status);
      onRsvpChange?.(status);
      
      // Refresh summary if showing
      if (showSummary) {
        const newSummary = await getRsvpSummary(activityShareId);
        setSummary(newSummary);
      }
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  const buttonClass = compact ? "h-7 text-xs px-2" : "h-8 text-xs";

  return (
    <div className="space-y-2">
      {/* RSVP Buttons */}
      <div className={cn("flex gap-1", compact ? "gap-0.5" : "gap-1")}>
        <Button
          variant={currentStatus === 'going' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            buttonClass,
            currentStatus === 'going' && "bg-green-600 hover:bg-green-700 border-green-600"
          )}
          onClick={() => handleRsvp('going')}
          disabled={loading}
        >
          {loading && currentStatus !== 'going' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <Check className="h-3 w-3 mr-1" />
              {compact ? '✓' : 'Going'}
            </>
          )}
        </Button>
        
        <Button
          variant={currentStatus === 'maybe' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            buttonClass,
            currentStatus === 'maybe' && "bg-amber-500 hover:bg-amber-600 border-amber-500"
          )}
          onClick={() => handleRsvp('maybe')}
          disabled={loading}
        >
          {loading && currentStatus !== 'maybe' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <HelpCircle className="h-3 w-3 mr-1" />
              {compact ? '?' : 'Maybe'}
            </>
          )}
        </Button>
        
        <Button
          variant={currentStatus === 'declined' ? 'default' : 'outline'}
          size="sm"
          className={cn(
            buttonClass,
            currentStatus === 'declined' && "bg-muted hover:bg-muted/80 text-muted-foreground border-muted"
          )}
          onClick={() => handleRsvp('declined')}
          disabled={loading}
        >
          {loading && currentStatus !== 'declined' ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <>
              <X className="h-3 w-3 mr-1" />
              {compact ? '✗' : "Can't"}
            </>
          )}
        </Button>
      </div>

      {/* Summary badges */}
      {showSummary && summary && (summary.going_count > 0 || summary.maybe_count > 0) && (
        <div className="flex items-center gap-1.5 text-xs">
          <Users className="h-3 w-3 text-muted-foreground" />
          {summary.going_count > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs px-1.5 py-0">
              {summary.going_count} going
            </Badge>
          )}
          {summary.maybe_count > 0 && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs px-1.5 py-0">
              {summary.maybe_count} maybe
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
