import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { useCoordinationThreads, ThreadWithDetails, RsvpStatus } from '@/hooks/useCoordinationThreads';
import { useAuth } from '@/hooks/useAuth';
import { ThreadCard } from './ThreadCard';
import { CreateThreadDialog } from './CreateThreadDialog';
import { ProposeTimeDialog } from './ProposeTimeDialog';
import { format, isToday, isTomorrow, isThisWeek, isAfter, startOfToday } from 'date-fns';

// Group threads by date category
function groupThreadsByDate(threads: ThreadWithDetails[]) {
  const today: ThreadWithDetails[] = [];
  const tomorrow: ThreadWithDetails[] = [];
  const thisWeek: ThreadWithDetails[] = [];
  const later: ThreadWithDetails[] = [];
  const noDate: ThreadWithDetails[] = [];
  
  const now = startOfToday();
  
  threads.forEach(thread => {
    if (!thread.scheduled_date) {
      noDate.push(thread);
      return;
    }
    
    const date = new Date(thread.scheduled_date);
    
    if (isToday(date)) {
      today.push(thread);
    } else if (isTomorrow(date)) {
      tomorrow.push(thread);
    } else if (isThisWeek(date) && isAfter(date, now)) {
      thisWeek.push(thread);
    } else if (isAfter(date, now)) {
      later.push(thread);
    }
  });
  
  return { today, tomorrow, thisWeek, later, noDate };
}

export function CoordinationFeed() {
  const { user } = useAuth();
  const { threads, loading, createThread, proposeTime, acceptProposal, updateRsvp } = useCoordinationThreads();
  
  const [proposeDialogState, setProposeDialogState] = useState<{
    open: boolean;
    threadId: string;
    activityName: string;
  }>({ open: false, threadId: '', activityName: '' });

  // Categorize threads - must be before any returns
  const planningThreads = threads.filter(t => t.status === 'idea' || t.status === 'proposing');
  const scheduledThreads = threads.filter(t => t.status === 'scheduled');
  const pastThreads = threads.filter(t => t.status === 'completed' || t.status === 'cancelled');

  // Group scheduled threads by date - must be before any returns
  const groupedScheduled = useMemo(() => groupThreadsByDate(scheduledThreads), [scheduledThreads]);

  // Threads needing my response
  const needsResponse = useMemo(() => {
    if (!user) return [];
    return threads.filter(t => {
      const myParticipation = t.participants.find(p => p.user_id === user.id);
      if (!myParticipation) return false;
      
      // I was invited but haven't responded yet
      if (myParticipation.role === 'invited' && myParticipation.rsvp_status === 'pending') {
        return true;
      }
      
      // There are proposals I haven't acted on
      if (t.status === 'proposing') {
        const hasMyProposal = t.proposals.some(p => p.proposed_by === user.id && p.status === 'proposed');
        const hasOthersProposal = t.proposals.some(p => p.proposed_by !== user.id && p.status === 'proposed');
        return hasOthersProposal && !hasMyProposal;
      }
      
      return false;
    });
  }, [threads, user]);

  if (!user) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Please log in to see your coordination feed
      </div>
    );
  }

  const handleProposeTime = (threadId: string) => {
    const thread = threads.find(t => t.id === threadId);
    if (thread) {
      setProposeDialogState({
        open: true,
        threadId,
        activityName: thread.activity_name
      });
    }
  };

  const handlePropose = async (threadId: string, date: Date, notes?: string) => {
    return await proposeTime(threadId, date, notes);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Render a date group section
  const renderDateGroup = (title: string, threads: ThreadWithDetails[], highlight?: boolean) => {
    if (threads.length === 0) return null;
    
    return (
      <div className="space-y-3">
        <h4 className={`text-sm font-semibold ${highlight ? 'text-primary' : 'text-muted-foreground'}`}>
          {title}
        </h4>
        {threads.map(thread => (
          <ThreadCard
            key={thread.id}
            thread={thread}
            currentUserId={user.id}
            onProposeTime={handleProposeTime}
            onAcceptProposal={acceptProposal}
            onUpdateRsvp={updateRsvp}
            showQuickActions={true}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Coordination</h2>
        <CreateThreadDialog onCreateThread={createThread} />
      </div>

      {/* Needs Response Section */}
      {needsResponse.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-amber-600" />
            <h3 className="font-medium text-amber-800">Needs Your Response</h3>
            <Badge variant="secondary" className="bg-amber-500 text-white">
              {needsResponse.length}
            </Badge>
          </div>
          <div className="space-y-3">
            {needsResponse.map(thread => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                currentUserId={user.id}
                onProposeTime={handleProposeTime}
                onAcceptProposal={acceptProposal}
                onUpdateRsvp={updateRsvp}
                compact
              />
            ))}
          </div>
        </div>
      )}

      {/* Main Tabs - default to scheduled if nothing needs response and there are scheduled items */}
      <Tabs defaultValue={scheduledThreads.length > 0 && needsResponse.length === 0 ? "scheduled" : "planning"} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="planning" className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            Planning
            {planningThreads.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {planningThreads.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Scheduled
            {scheduledThreads.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {scheduledThreads.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4" />
            Past
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planning" className="mt-4 space-y-3">
          {planningThreads.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="font-medium mb-1">No plans in progress</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a plan to start coordinating with other parents
              </p>
              <CreateThreadDialog onCreateThread={createThread} />
            </div>
          ) : (
            planningThreads.map(thread => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                currentUserId={user.id}
                onProposeTime={handleProposeTime}
                onAcceptProposal={acceptProposal}
                onUpdateRsvp={updateRsvp}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-4 space-y-6">
          {scheduledThreads.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="font-medium mb-1">Nothing scheduled yet</h3>
              <p className="text-sm text-muted-foreground">
                Once you lock in a time, activities will appear here
              </p>
            </div>
          ) : (
            <>
              {renderDateGroup('Today', groupedScheduled.today, true)}
              {renderDateGroup('Tomorrow', groupedScheduled.tomorrow)}
              {renderDateGroup('This Week', groupedScheduled.thisWeek)}
              {renderDateGroup('Upcoming', groupedScheduled.later)}
              {renderDateGroup('To Be Scheduled', groupedScheduled.noDate)}
            </>
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4 space-y-3">
          {pastThreads.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <h3 className="font-medium mb-1">No past activities</h3>
              <p className="text-sm text-muted-foreground">
                Completed activities will be shown here
              </p>
            </div>
          ) : (
            pastThreads.map(thread => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                currentUserId={user.id}
                onProposeTime={handleProposeTime}
                onAcceptProposal={acceptProposal}
                onUpdateRsvp={updateRsvp}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Propose Time Dialog */}
      <ProposeTimeDialog
        open={proposeDialogState.open}
        onOpenChange={(open) => setProposeDialogState(prev => ({ ...prev, open }))}
        threadId={proposeDialogState.threadId}
        activityName={proposeDialogState.activityName}
        onPropose={handlePropose}
      />
    </div>
  );
}
