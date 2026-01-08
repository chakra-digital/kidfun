import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCoordinationThreads, type ThreadWithDetails } from '@/hooks/useCoordinationThreads';
import { useSocialConnections } from '@/hooks/useSocialConnections';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Calendar, 
  MessageCircle, 
  ArrowRight, 
  Clock, 
  CheckCircle2,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Dummy data for logged-out users or those without activity
const DUMMY_THREADS = [
  {
    id: 'demo-1',
    organizer_name: 'Sarah M.',
    activity_name: 'Soccer at Kick It Sports',
    status: 'scheduled' as const,
    scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    participants: [
      { rsvp_status: 'going', profile: { first_name: 'Emma' } },
      { rsvp_status: 'going', profile: { first_name: 'Liam' } },
      { rsvp_status: 'maybe', profile: { first_name: 'Noah' } },
    ],
    provider_name: 'Kick It Sports',
  },
  {
    id: 'demo-2',
    organizer_name: 'Marcus T.',
    activity_name: 'Art Workshop',
    status: 'proposing' as const,
    scheduled_date: null,
    participants: [
      { rsvp_status: 'going', profile: { first_name: 'Olivia' } },
      { rsvp_status: 'pending', profile: { first_name: 'You' } },
    ],
    provider_name: 'Creative Kids Studio',
    isInvite: true,
  },
  {
    id: 'demo-3',
    organizer_name: 'Jenna K.',
    activity_name: 'Anyone free for swim lessons next week?',
    status: 'idea' as const,
    scheduled_date: null,
    participants: [
      { rsvp_status: 'going', profile: { first_name: 'Jenna' } },
    ],
    replies: 3,
  },
];

// Dummy connection suggestions
const DUMMY_CONNECTIONS = [
  { name: 'Lisa P.', school: 'Lincoln Elementary', mutualFriends: 4 },
  { name: 'David R.', school: 'Lincoln Elementary', mutualFriends: 2 },
];

interface ThreadCardProps {
  thread: typeof DUMMY_THREADS[0] | ThreadWithDetails;
  isDummy?: boolean;
  onClick: () => void;
}

const ThreadCard = ({ thread, isDummy, onClick }: ThreadCardProps) => {
  const goingCount = thread.participants?.filter(p => p.rsvp_status === 'going').length || 0;
  const maybeCount = thread.participants?.filter(p => p.rsvp_status === 'maybe').length || 0;
  const isInvite = 'isInvite' in thread && thread.isInvite;
  const replies = 'replies' in thread ? thread.replies : 0;
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    const days = differenceInDays(date, new Date());
    if (days <= 7) return format(date, 'EEEE');
    return format(date, 'MMM d');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'proposing': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'idea': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/30 ${
        isInvite ? 'ring-2 ring-primary/20 bg-primary/5' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Status indicator */}
          <div className="mt-0.5">
            {thread.status === 'scheduled' ? (
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            ) : thread.status === 'proposing' ? (
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            ) : (
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">
                {thread.organizer_name}
              </span>
              {isInvite && (
                <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                  Invited you
                </Badge>
              )}
            </div>
            
            {/* Activity name */}
            <p className="font-semibold text-foreground mb-2 line-clamp-1">
              {thread.activity_name}
            </p>
            
            {/* Meta row */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
              {thread.scheduled_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(thread.scheduled_date)}</span>
                </div>
              )}
              
              {goingCount > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                  <span>{goingCount} going</span>
                </div>
              )}
              
              {maybeCount > 0 && (
                <div className="flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                  <span>{maybeCount} maybe</span>
                </div>
              )}
              
              {replies > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>{replies} replies</span>
                </div>
              )}
            </div>
            
            {/* Participant avatars */}
            {thread.participants && thread.participants.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <div className="flex -space-x-2">
                  {thread.participants.slice(0, 4).map((p, i) => (
                    <Avatar key={i} className="h-6 w-6 border-2 border-background">
                      <AvatarFallback className="text-xs bg-muted">
                        {p.profile?.first_name?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {thread.participants.length > 4 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    +{thread.participants.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
          
          {/* Action hint */}
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
        </div>
      </CardContent>
    </Card>
  );
};

interface CoordinationTeaserProps {
  className?: string;
}

const CoordinationTeaser = ({ className }: CoordinationTeaserProps) => {
  const { user, loading: authLoading } = useAuth();
  const { threads, loading: threadsLoading } = useCoordinationThreads();
  const { connections } = useSocialConnections();
  const navigate = useNavigate();

  const isLoggedIn = !!user;
  const hasRealData = threads.length > 0;
  
  // Use real threads if available, otherwise dummy
  const displayThreads = hasRealData ? threads.slice(0, 3) : DUMMY_THREADS;
  
  // Show pending invites count
  const pendingInvites = threads.filter(t => 
    t.participants.some(p => p.user_id === user?.id && p.rsvp_status === 'pending')
  );

  const handleThreadClick = (thread: typeof DUMMY_THREADS[0] | ThreadWithDetails) => {
    if ('id' in thread && !thread.id.startsWith('demo-')) {
      navigate('/dashboard', { state: { openThread: thread.id } });
    } else if (!isLoggedIn) {
      navigate('/auth');
    } else {
      navigate('/dashboard');
    }
  };

  const handleStartPlan = () => {
    if (!isLoggedIn) {
      navigate('/auth');
    } else {
      navigate('/dashboard');
    }
  };

  const handleFindParents = () => {
    if (!isLoggedIn) {
      navigate('/auth');
    } else {
      navigate('/find-parents');
    }
  };

  // Don't render during initial auth loading
  if (authLoading) return null;

  return (
    <section className={`py-12 bg-gradient-to-b from-muted/30 to-background ${className}`}>
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">My Circle</h2>
              {pendingInvites.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingInvites.length} new
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              {isLoggedIn 
                ? 'See what friends are planning and coordinate together'
                : 'Connect with parents at your school and plan activities together'
              }
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Activity feed - 2 columns */}
          <div className="md:col-span-2 space-y-3">
            {!isLoggedIn && (
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-lg p-4 mb-4 flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm">
                  <span className="font-medium">See what this could look like for you!</span>
                  {' '}Sign up to connect with real parents at your school.
                </p>
              </div>
            )}
            
            {displayThreads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                isDummy={!hasRealData}
                onClick={() => handleThreadClick(thread)}
              />
            ))}

            {/* CTA button */}
            <Button 
              onClick={handleStartPlan}
              className="w-full mt-4"
              size="lg"
            >
              {isLoggedIn ? 'Start a Plan with Friends' : 'Sign Up to Start Planning'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Connection suggestions - 1 column */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  {isLoggedIn ? 'Suggested Connections' : 'Find Parents Near You'}
                </h3>
                
                {(isLoggedIn && connections.length > 0 ? connections.slice(0, 2) : DUMMY_CONNECTIONS).map((conn, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3 py-2 border-b last:border-0"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {'name' in conn ? conn.name[0] : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {'name' in conn ? conn.name : 'Parent'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {'school' in conn ? conn.school : ''}
                      </p>
                    </div>
                    {'mutualFriends' in conn && conn.mutualFriends > 0 && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        {conn.mutualFriends} mutual
                      </Badge>
                    )}
                  </div>
                ))}

                <Button 
                  variant="outline" 
                  className="w-full mt-3"
                  onClick={handleFindParents}
                >
                  {isLoggedIn ? 'Find More Parents' : 'Sign Up to Connect'}
                </Button>
              </CardContent>
            </Card>

            {/* Stats teaser */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-primary">2.5 hrs</p>
                <p className="text-sm text-muted-foreground">
                  Average time saved per week by coordinating together
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoordinationTeaser;
