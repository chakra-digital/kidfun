import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Check, 
  HelpCircle,
  X,
  ChevronDown,
  ChevronUp,
  MessageCircle
} from 'lucide-react';
import { 
  ThreadWithDetails, 
  RsvpStatus,
  ThreadStatus 
} from '@/hooks/useCoordinationThreads';
import { cn } from '@/lib/utils';
import { ThreadProposals } from './ThreadProposals';
import { ThreadRsvpButtons } from './ThreadRsvpButtons';

interface ThreadCardProps {
  thread: ThreadWithDetails;
  currentUserId: string;
  onProposeTime: (threadId: string) => void;
  onAcceptProposal: (proposalId: string) => void;
  onUpdateRsvp: (threadId: string, status: RsvpStatus) => void;
  compact?: boolean;
}

const statusConfig: Record<ThreadStatus, { label: string; color: string; icon: React.ReactNode }> = {
  idea: { 
    label: 'Planning', 
    color: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    icon: <MessageCircle className="h-3 w-3" />
  },
  proposing: { 
    label: 'Choosing Time', 
    color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    icon: <Clock className="h-3 w-3" />
  },
  scheduled: { 
    label: 'Scheduled', 
    color: 'bg-green-500/10 text-green-600 border-green-500/20',
    icon: <Calendar className="h-3 w-3" />
  },
  completed: { 
    label: 'Completed', 
    color: 'bg-muted text-muted-foreground border-muted',
    icon: <Check className="h-3 w-3" />
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'bg-destructive/10 text-destructive border-destructive/20',
    icon: <X className="h-3 w-3" />
  }
};

export function ThreadCard({
  thread,
  currentUserId,
  onProposeTime,
  onAcceptProposal,
  onUpdateRsvp,
  compact = false
}: ThreadCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  const myParticipation = thread.participants.find(p => p.user_id === currentUserId);
  const otherParticipants = thread.participants.filter(p => p.user_id !== currentUserId);
  const isOrganizer = thread.created_by === currentUserId;
  const activeProposals = thread.proposals.filter(p => p.status === 'proposed');
  const acceptedProposal = thread.proposals.find(p => p.status === 'accepted');
  
  const status = statusConfig[thread.status];
  
  // RSVP summary
  const goingCount = thread.participants.filter(p => p.rsvp_status === 'going').length;
  const maybeCount = thread.participants.filter(p => p.rsvp_status === 'maybe').length;

  const getParticipantInitials = (participant: typeof thread.participants[0]) => {
    const profile = participant.profile;
    if (profile?.first_name) {
      return profile.first_name[0] + (profile.last_name?.[0] ?? '');
    }
    return '?';
  };

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-md",
      thread.status === 'scheduled' && "border-l-4 border-l-green-500"
    )}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={cn("text-xs", status.color)}>
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Badge>
              {isOrganizer && (
                <Badge variant="secondary" className="text-xs">Organizer</Badge>
              )}
            </div>
            
            <h3 className="font-semibold text-base truncate">{thread.activity_name}</h3>
            
            {thread.provider_name && (
              <p className="text-sm text-muted-foreground truncate">
                {thread.provider_name}
              </p>
            )}
          </div>

          {/* Participants avatars */}
          <div className="flex -space-x-2">
            {thread.participants.slice(0, 4).map((participant) => (
              <Avatar key={participant.id} className="h-8 w-8 border-2 border-background">
                <AvatarFallback className="text-xs bg-primary/10">
                  {getParticipantInitials(participant)}
                </AvatarFallback>
              </Avatar>
            ))}
            {thread.participants.length > 4 && (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs border-2 border-background">
                +{thread.participants.length - 4}
              </div>
            )}
          </div>
        </div>

        {/* Date & Location Info */}
        <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
          {thread.scheduled_date ? (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="font-medium text-foreground">
                {format(new Date(thread.scheduled_date), 'EEE, MMM d • h:mm a')}
              </span>
            </div>
          ) : activeProposals.length > 0 ? (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-blue-600" />
              <span>{activeProposals.length} time{activeProposals.length > 1 ? 's' : ''} proposed</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>No times proposed yet</span>
            </div>
          )}
          
          {thread.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span className="truncate max-w-[150px]">{thread.location}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>
              {goingCount} going
              {maybeCount > 0 && `, ${maybeCount} maybe`}
            </span>
          </div>
        </div>

        {/* RSVP section for scheduled threads */}
        {thread.status === 'scheduled' && myParticipation && (
          <div className="mt-4 pt-3 border-t">
            <ThreadRsvpButtons
              currentStatus={myParticipation.rsvp_status}
              onRsvp={(status) => onUpdateRsvp(thread.id, status)}
            />
          </div>
        )}

        {/* Expand/collapse for proposals */}
        {(thread.status === 'idea' || thread.status === 'proposing') && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-3 text-muted-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide details
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  {activeProposals.length > 0 
                    ? `View ${activeProposals.length} proposed time${activeProposals.length > 1 ? 's' : ''}`
                    : 'Propose a time'
                  }
                </>
              )}
            </Button>

            {expanded && (
              <div className="mt-3 pt-3 border-t space-y-3">
                <ThreadProposals
                  proposals={thread.proposals}
                  currentUserId={currentUserId}
                  onAccept={onAcceptProposal}
                />
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onProposeTime(thread.id)}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Propose a time
                </Button>
              </div>
            )}
          </>
        )}

        {/* Timestamp */}
        <p className="text-xs text-muted-foreground mt-3">
          {isOrganizer ? 'You created' : `${thread.organizer_name} shared`} • {formatDistanceToNow(new Date(thread.created_at), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );
}
