import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { CalendarDays, Users, ChevronLeft, ChevronRight, Clock, Share2, Check } from 'lucide-react';
import { format, isSameDay, addMonths, subMonths } from 'date-fns';
import { useSavedActivities, SavedActivity } from '@/hooks/useSavedActivities';
import { useSocialConnections } from '@/hooks/useSocialConnections';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { ShareActivityDialog } from './ShareActivityDialog';
import { RsvpButtons } from './RsvpButtons';
import { RsvpSummaryCard } from './RsvpSummaryCard';

interface CalendarActivity extends SavedActivity {
  isConnection?: boolean;
  connectionName?: string;
  activityShareId?: string; // For RSVP tracking
  isSharedWithMe?: boolean; // Activity was shared with current user
  isMyShare?: boolean; // User created this share
}

interface ActivityShare {
  id: string;
  shared_by: string;
  shared_with: string | null;
  activity_name: string;
  provider_name: string | null;
  provider_id: string | null;
  created_at: string;
}

export const SharedCalendar = () => {
  const { user } = useAuth();
  const { savedActivities, fetchConnectionActivities } = useSavedActivities();
  const { connections } = useSocialConnections();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [allActivities, setAllActivities] = useState<CalendarActivity[]>([]);
  const [activityShares, setActivityShares] = useState<ActivityShare[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch activity shares (invites sent to or from user)
  const fetchActivityShares = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('activity_shares')
        .select('*')
        .or(`shared_by.eq.${user.id},shared_with.eq.${user.id}`);

      if (error) throw error;
      return (data || []) as ActivityShare[];
    } catch (err) {
      console.error('Error fetching activity shares:', err);
      return [];
    }
  };

  const normalize = (value?: string | null) => (value ?? '').trim().toLowerCase();

  const shareMatchesActivity = (share: ActivityShare, activity: SavedActivity) => {
    if (share.provider_id && activity.provider_id) return share.provider_id === activity.provider_id;
    if (share.provider_name) return normalize(share.provider_name) === normalize(activity.provider_name);

    const shareTitle = normalize(share.activity_name);
    const activityTitle = normalize(activity.activity_name ?? activity.provider_name);
    return Boolean(shareTitle && activityTitle && shareTitle === activityTitle);
  };

  const getConnectionNameByUserId = (userId: string) => {
    const connection = connections.find(c => c.connected_parent_id === userId);
    return connection?.profile
      ? `${connection.profile.first_name} ${connection.profile.last_name}`
      : 'Connection';
  };

  useEffect(() => {
    const loadAllActivities = async () => {
      setLoading(true);

      // Fetch activity shares
      const shares = await fetchActivityShares();
      setActivityShares(shares);

      // Start with user's own activities
      const userActivities: CalendarActivity[] = savedActivities
        .filter(a => a.scheduled_date)
        .map(a => {
          // Shares where current user is the recipient (so RSVP can show on "You" card)
          const inviteShare = shares.find(s => s.shared_with === user?.id && shareMatchesActivity(s, a));

          // Shares created by current user (for RSVP summary)
          const myShare = shares.find(s => s.shared_by === user?.id && shareMatchesActivity(s, a));

          return {
            ...a,
            isConnection: false,
            activityShareId: inviteShare?.id ?? myShare?.id,
            isSharedWithMe: !!inviteShare,
            connectionName: inviteShare ? getConnectionNameByUserId(inviteShare.shared_by) : undefined,
            isMyShare: !!myShare,
          };
        });

      const userActivityKeys = new Set(
        userActivities.map(a => `${a.provider_id ?? a.provider_name}__${a.scheduled_date ?? ''}`)
      );

      // Add connection activities
      if (connections.length > 0) {
        const connectionIds = connections.map(c => c.connected_parent_id);
        const connectionActs = await fetchConnectionActivities(connectionIds);

        const connectionActivitiesWithMeta: CalendarActivity[] = connectionActs
          .filter(a => a.scheduled_date)
          .map(a => {
            const connection = connections.find(c => c.connected_parent_id === a.user_id);

            // Check if this activity was shared with current user
            const share = shares.find(s =>
              s.shared_with === user?.id &&
              s.shared_by === a.user_id &&
              shareMatchesActivity(s, a)
            );

            return {
              ...a,
              isConnection: true,
              connectionName: connection?.profile
                ? `${connection.profile.first_name} ${connection.profile.last_name}`
                : 'Connection',
              activityShareId: share?.id,
              isSharedWithMe: !!share,
            };
          })
          // If user already accepted (has a matching "You" activity), hide the duplicate connection pill.
          .filter(a => {
            if (!a.isSharedWithMe) return true;
            const key = `${a.provider_id ?? a.provider_name}__${a.scheduled_date ?? ''}`;
            return !userActivityKeys.has(key);
          });

        setAllActivities([...userActivities, ...connectionActivitiesWithMeta]);
      } else {
        setAllActivities(userActivities);
      }

      setLoading(false);
    };

    loadAllActivities();
  }, [savedActivities, connections, user]);

  const getActivitiesForDate = (date: Date): CalendarActivity[] => {
    return allActivities.filter(activity => {
      if (!activity.scheduled_date) return false;
      return isSameDay(new Date(activity.scheduled_date), date);
    });
  };

  const hasActivitiesOnDate = (date: Date): { hasOwn: boolean; hasConnection: boolean } => {
    const activities = getActivitiesForDate(date);
    return {
      hasOwn: activities.some(a => !a.isConnection),
      hasConnection: activities.some(a => a.isConnection)
    };
  };

  const selectedDateActivities = selectedDate ? getActivitiesForDate(selectedDate) : [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Shared Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex gap-4 mt-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">Your activities</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
            <span className="text-muted-foreground">Connections</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="animate-pulse h-[300px] bg-muted rounded" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Calendar */}
            <div>
              <Calendar
                key={`calendar-${allActivities.length}`}
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md border pointer-events-auto"
                components={{
                  DayContent: ({ date }) => {
                    const { hasOwn, hasConnection } = hasActivitiesOnDate(date);
                    return (
                      <div className="relative w-full h-full flex items-center justify-center">
                        {date.getDate()}
                        {(hasOwn || hasConnection) && (
                          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {hasOwn && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                            {hasConnection && <div className="w-1.5 h-1.5 rounded-full bg-secondary-foreground/50" />}
                          </div>
                        )}
                      </div>
                    );
                  },
                }}
              />
            </div>
            
            {/* Selected day activities */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">
                {selectedDate 
                  ? format(selectedDate, 'EEEE, MMMM d')
                  : 'Select a date to see activities'
                }
              </h4>
              
              {selectedDate && selectedDateActivities.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No activities scheduled for this day
                </p>
              )}
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {selectedDateActivities.map((activity) => (
                  <div 
                    key={activity.id}
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      activity.isConnection 
                        ? "bg-secondary/20 border-secondary/30" 
                        : "bg-primary/5 border-primary/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {activity.provider_name}
                        </p>
                        {activity.activity_name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {activity.activity_name}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={activity.isConnection ? "secondary" : "default"}
                        className="text-xs shrink-0"
                      >
                        {activity.isConnection ? (
                          <><Users className="h-3 w-3 mr-1" />{activity.connectionName}</>
                        ) : (
                          'You'
                        )}
                      </Badge>
                    </div>
                    
                    {activity.scheduled_date && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(activity.scheduled_date), 'h:mm a')}
                      </p>
                    )}
                    
                    {/* RSVP section for activities shared with the user */}
                    {activity.isSharedWithMe && activity.activityShareId && (
                      <div className="mt-3 pt-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                          <Check className="h-3 w-3" /> Invited by {activity.connectionName}
                        </p>
                        <RsvpButtons 
                          activityShareId={activity.activityShareId}
                          showSummary={false}
                        />
                      </div>
                    )}
                    
                    {/* RSVP summary for activities the user has shared */}
                    {activity.isMyShare && activity.activityShareId && (
                      <div className="mt-3">
                        <RsvpSummaryCard 
                          activityShareId={activity.activityShareId}
                          className="mt-2"
                        />
                      </div>
                    )}
                    
                    {/* Share button for user's own unshared activities */}
                    {!activity.isConnection && !activity.isMyShare && (
                      <ShareActivityDialog
                        providerId={activity.provider_id || undefined}
                        providerName={activity.provider_name}
                        activityName={activity.activity_name || undefined}
                      >
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 w-full text-xs"
                        >
                          <Share2 className="h-3 w-3 mr-1" />
                          Invite parents
                        </Button>
                      </ShareActivityDialog>
                    )}
                    
                    {/* Connection activities - show shared by info */}
                    {activity.isConnection && !activity.isSharedWithMe && (
                      <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>Shared by {activity.connectionName}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
