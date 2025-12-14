import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { CalendarDays, Users, ChevronLeft, ChevronRight, Clock, UserPlus, Loader2 } from 'lucide-react';
import { format, isSameDay, addMonths, subMonths } from 'date-fns';
import { useSavedActivities, SavedActivity } from '@/hooks/useSavedActivities';
import { useSocialConnections } from '@/hooks/useSocialConnections';
import { useActivityCoordination } from '@/hooks/useActivityCoordination';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface CalendarActivity extends SavedActivity {
  isConnection?: boolean;
  connectionName?: string;
}

export const SharedCalendar = () => {
  const { user } = useAuth();
  const { savedActivities, fetchConnectionActivities } = useSavedActivities();
  const { connections } = useSocialConnections();
  const { sendJoinRequest } = useActivityCoordination();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [allActivities, setAllActivities] = useState<CalendarActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningActivityId, setJoiningActivityId] = useState<string | null>(null);

  useEffect(() => {
    const loadAllActivities = async () => {
      setLoading(true);
      
      // Start with user's own activities
      const userActivities: CalendarActivity[] = savedActivities
        .filter(a => a.scheduled_date)
        .map(a => ({ ...a, isConnection: false }));

      // Add connection activities
      if (connections.length > 0) {
        const connectionIds = connections.map(c => c.connected_parent_id);
        const connectionActs = await fetchConnectionActivities(connectionIds);
        
        const connectionActivitiesWithMeta: CalendarActivity[] = connectionActs
          .filter(a => a.scheduled_date)
          .map(a => {
            const connection = connections.find(c => c.connected_parent_id === a.user_id);
            return {
              ...a,
              isConnection: true,
              connectionName: connection?.profile 
                ? `${connection.profile.first_name} ${connection.profile.last_name}`
                : 'Connection'
            };
          });

        setAllActivities([...userActivities, ...connectionActivitiesWithMeta]);
      } else {
        setAllActivities(userActivities);
      }
      
      setLoading(false);
    };

    loadAllActivities();
  }, [savedActivities, connections]);

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

  const handleAskToJoin = async (activity: CalendarActivity) => {
    if (!activity.isConnection || !activity.user_id) return;
    
    setJoiningActivityId(activity.id);
    try {
      await sendJoinRequest(
        activity.id,
        activity.user_id,
        `Hi! I saw you're planning to go to ${activity.provider_name}. Would love to coordinate and join with our kids!`
      );
    } finally {
      setJoiningActivityId(null);
    }
  };

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
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                className="rounded-md border pointer-events-auto"
                modifiers={{
                  hasActivity: (date) => {
                    const { hasOwn, hasConnection } = hasActivitiesOnDate(date);
                    return hasOwn || hasConnection;
                  },
                }}
                modifiersClassNames={{
                  hasActivity: 'relative',
                }}
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
              
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
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
                    
                    {/* Join button for connection activities */}
                    {activity.isConnection && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 w-full text-xs"
                        disabled={joiningActivityId === activity.id}
                        onClick={() => handleAskToJoin(activity)}
                      >
                        {joiningActivityId === activity.id ? (
                          <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Sending...</>
                        ) : (
                          <><UserPlus className="h-3 w-3 mr-1" />Ask to join</>
                        )}
                      </Button>
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
