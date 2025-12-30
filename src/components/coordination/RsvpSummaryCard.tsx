import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Check, HelpCircle, X, Loader2 } from 'lucide-react';
import { useActivityRsvp, RsvpWithProfile, RsvpSummary } from '@/hooks/useActivityRsvp';
import { cn } from '@/lib/utils';

interface RsvpSummaryCardProps {
  activityShareId: string;
  className?: string;
}

export const RsvpSummaryCard: React.FC<RsvpSummaryCardProps> = ({
  activityShareId,
  className
}) => {
  const { getRsvpSummary, getRsvpsWithProfiles } = useActivityRsvp();
  const [summary, setSummary] = useState<RsvpSummary | null>(null);
  const [rsvps, setRsvps] = useState<RsvpWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [summaryData, rsvpData] = await Promise.all([
        getRsvpSummary(activityShareId),
        getRsvpsWithProfiles(activityShareId)
      ]);
      setSummary(summaryData);
      setRsvps(rsvpData);
      setLoading(false);
    };

    loadData();
  }, [activityShareId, getRsvpSummary, getRsvpsWithProfiles]);

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-4", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!summary || (summary.going_count === 0 && summary.maybe_count === 0 && summary.declined_count === 0)) {
    return (
      <div className={cn("text-xs text-muted-foreground text-center py-2", className)}>
        No responses yet
      </div>
    );
  }

  const goingRsvps = rsvps.filter(r => r.status === 'going');
  const maybeRsvps = rsvps.filter(r => r.status === 'maybe');
  const declinedRsvps = rsvps.filter(r => r.status === 'declined');

  const getInitials = (profile?: { first_name: string | null; last_name: string | null }) => {
    if (!profile) return '?';
    const first = profile.first_name?.[0] || '';
    const last = profile.last_name?.[0] || '';
    return (first + last).toUpperCase() || '?';
  };

  const RsvpGroup = ({ 
    rsvps, 
    label, 
    icon: Icon, 
    bgClass, 
    textClass 
  }: { 
    rsvps: RsvpWithProfile[]; 
    label: string; 
    icon: typeof Check;
    bgClass: string;
    textClass: string;
  }) => {
    if (rsvps.length === 0) return null;
    
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("h-3 w-3", textClass)} />
          <span className={cn("text-xs font-medium", textClass)}>{label} ({rsvps.length})</span>
        </div>
        <div className="flex flex-wrap gap-1">
          {rsvps.map(rsvp => (
            <div 
              key={rsvp.id} 
              className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs", bgClass)}
            >
              <Avatar className="h-4 w-4">
                <AvatarFallback className="text-[8px]">
                  {getInitials(rsvp.profile)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[80px]">
                {rsvp.profile?.first_name || 'Unknown'}
              </span>
              {rsvp.children_bringing && rsvp.children_bringing.length > 0 && (
                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                  +{rsvp.children_bringing.length}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="p-3 space-y-3">
        {/* Summary header */}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Responses</span>
          <div className="flex gap-1 ml-auto">
            {summary.going_count > 0 && (
              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">
                {summary.going_count} going
              </Badge>
            )}
            {summary.maybe_count > 0 && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">
                {summary.maybe_count} maybe
              </Badge>
            )}
          </div>
        </div>

        {/* Detailed breakdown */}
        <div className="space-y-2">
          <RsvpGroup 
            rsvps={goingRsvps} 
            label="Going" 
            icon={Check}
            bgClass="bg-green-100 dark:bg-green-900/30"
            textClass="text-green-600 dark:text-green-400"
          />
          <RsvpGroup 
            rsvps={maybeRsvps} 
            label="Maybe" 
            icon={HelpCircle}
            bgClass="bg-amber-100 dark:bg-amber-900/30"
            textClass="text-amber-600 dark:text-amber-400"
          />
          {declinedRsvps.length > 0 && (
            <RsvpGroup 
              rsvps={declinedRsvps} 
              label="Can't make it" 
              icon={X}
              bgClass="bg-muted"
              textClass="text-muted-foreground"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
