import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useCoordinationThreads, type ThreadWithDetails } from '@/hooks/useCoordinationThreads';
import { useSocialConnections } from '@/hooks/useSocialConnections';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Calendar, 
  ArrowRight, 
  Clock, 
  CheckCircle2,
  Sparkles,
  Plus,
  MapPin,
  UserPlus
} from 'lucide-react';
import { format, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Dummy data for logged-out users
const DUMMY_THREADS = [
  {
    id: 'demo-1',
    organizer_name: 'Sarah M.',
    activity_name: 'Soccer Practice',
    status: 'scheduled' as const,
    scheduled_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    participants: [
      { rsvp_status: 'going', profile: { first_name: 'Emma' } },
      { rsvp_status: 'going', profile: { first_name: 'Liam' } },
      { rsvp_status: 'maybe', profile: { first_name: 'Noah' } },
    ],
    provider_name: 'Kick It Sports',
    location: 'Lincoln Field',
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
    activity_name: 'Swim Lessons',
    status: 'idea' as const,
    scheduled_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    participants: [
      { rsvp_status: 'going', profile: { first_name: 'Jenna' } },
      { rsvp_status: 'maybe', profile: { first_name: 'Sam' } },
    ],
    provider_name: 'Aqua Center',
  },
];

const DUMMY_CONNECTIONS = [
  { name: 'Lisa Peterson', school: 'Lincoln Elementary', mutualFriends: 4 },
  { name: 'David Roberts', school: 'Lincoln Elementary', mutualFriends: 2 },
  { name: 'Amy Chen', school: 'Lincoln Elementary', mutualFriends: 3 },
];

interface ThreadCardProps {
  thread: typeof DUMMY_THREADS[0] | ThreadWithDetails;
  isDummy?: boolean;
  onClick: () => void;
  featured?: boolean;
}

const ThreadCard = ({ thread, isDummy, onClick, featured }: ThreadCardProps) => {
  const goingCount = thread.participants?.filter(p => p.rsvp_status === 'going').length || 0;
  const isInvite = 'isInvite' in thread && thread.isInvite;
  
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    const days = differenceInDays(date, new Date());
    if (days <= 7) return format(date, 'EEEE');
    return format(date, 'MMM d');
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'scheduled': return { 
        dot: 'bg-secondary', 
        badge: 'bg-secondary/10 text-secondary border-secondary/20',
        label: 'Confirmed'
      };
      case 'proposing': return { 
        dot: 'bg-accent', 
        badge: 'bg-accent/10 text-accent border-accent/20',
        label: 'Picking Time'
      };
      default: return { 
        dot: 'bg-primary', 
        badge: 'bg-primary/10 text-primary border-primary/20',
        label: 'Planning'
      };
    }
  };

  const statusStyles = getStatusStyles(thread.status);
  const location = 'location' in thread ? thread.location : null;

  return (
    <div 
      className={`
        group relative bg-card rounded-xl border transition-all duration-300 cursor-pointer
        hover:shadow-card-hover hover:border-primary/30
        ${featured ? 'p-5' : 'p-4'}
        ${isInvite ? 'ring-2 ring-primary/30 border-primary/20' : 'border-border'}
      `}
      onClick={onClick}
    >
      {/* Invite highlight */}
      {isInvite && (
        <div className="absolute -top-2.5 left-4">
          <Badge className="bg-primary text-primary-foreground shadow-sm text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            You're invited!
          </Badge>
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Left: Avatar cluster */}
        <div className="relative shrink-0">
          <div className="flex -space-x-2">
            {thread.participants?.slice(0, 3).map((p, i) => (
              <Avatar 
                key={i} 
                className={`border-2 border-card shadow-sm ${featured ? 'h-10 w-10' : 'h-8 w-8'}`}
              >
                <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                  {p.profile?.first_name?.[0] || '?'}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          {/* Status dot */}
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusStyles.dot} ring-2 ring-card`} />
        </div>
        
        {/* Center: Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-muted-foreground">
              {thread.organizer_name}
            </span>
            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 ${statusStyles.badge}`}>
              {statusStyles.label}
            </Badge>
          </div>
          
          <h4 className={`font-semibold text-foreground mb-1.5 line-clamp-1 ${featured ? 'text-lg' : 'text-base'}`}>
            {thread.activity_name}
          </h4>
          
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {thread.scheduled_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(thread.scheduled_date)}
              </span>
            )}
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {location}
              </span>
            )}
            {goingCount > 0 && (
              <span className="flex items-center gap-1 text-secondary">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {goingCount} going
              </span>
            )}
          </div>
        </div>
        
        {/* Right: Action */}
        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

interface CoordinationTeaserProps {
  className?: string;
}

const CoordinationTeaser = ({ className }: CoordinationTeaserProps) => {
  const { user, loading: authLoading } = useAuth();
  const { threads } = useCoordinationThreads();
  const { connections } = useSocialConnections();
  const navigate = useNavigate();

  const isLoggedIn = !!user;
  const hasRealData = threads.length > 0;
  const displayThreads = hasRealData ? threads.slice(0, 3) : DUMMY_THREADS;
  
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
    navigate(isLoggedIn ? '/dashboard' : '/auth');
  };

  const handleFindParents = () => {
    navigate(isLoggedIn ? '/find-parents' : '/auth');
  };

  if (authLoading) return null;

  return (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Users className="h-4 w-4" />
            My Circle
            {pendingInvites.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                {pendingInvites.length}
              </Badge>
            )}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            {isLoggedIn ? 'Your Parent Network' : 'Plan Together, Play Together'}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {isLoggedIn 
              ? 'See what friends are planning and join in on activities'
              : 'Connect with parents from your school and coordinate kids\' activities effortlessly'
            }
          </p>
        </div>

        {/* Demo banner for logged-out users */}
        {!isLoggedIn && (
          <div className="glass-card p-4 mb-8 flex items-center justify-center gap-3 max-w-2xl mx-auto">
            <Sparkles className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-center">
              <span className="font-medium">Preview mode</span> — Sign up to see real parents from your school
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Activity feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Plans
              </h3>
              {isLoggedIn && (
                <Button variant="ghost" size="sm" onClick={handleStartPlan}>
                  <Plus className="h-4 w-4 mr-1" />
                  New Plan
                </Button>
              )}
            </div>
            
            {displayThreads.map((thread, i) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                isDummy={!hasRealData}
                onClick={() => handleThreadClick(thread)}
                featured={i === 0}
              />
            ))}

            <div className="flex justify-center">
              <Button 
                onClick={handleStartPlan}
                className="btn-glow"
                size="lg"
              >
                {isLoggedIn ? 'Start a Plan with Friends' : 'Sign Up to Start Planning'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Connections card */}
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                {isLoggedIn ? 'Suggested Connections' : 'Parents Near You'}
              </h3>
              
              <div className="space-y-3">
                {(isLoggedIn && connections.length > 0 
                  ? connections.slice(0, 3).map(c => ({ name: c.profile?.first_name || 'Parent', school: 'Your school' }))
                  : DUMMY_CONNECTIONS
                ).map((conn, i) => (
                  <div 
                    key={i}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={handleFindParents}
                  >
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarFallback className="bg-primary/5 text-primary font-medium">
                        {conn.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{conn.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{conn.school}</p>
                    </div>
                    {'mutualFriends' in conn && typeof conn.mutualFriends === 'number' && (
                      <span className="text-xs text-muted-foreground">
                        {conn.mutualFriends} mutual
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={handleFindParents}
              >
                {isLoggedIn ? 'Find More Parents' : 'Sign Up to Connect'}
              </Button>
            </div>

            {/* Stats card */}
            <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-secondary/5 rounded-xl p-5 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground mb-1">2.5 hrs</p>
              <p className="text-sm text-muted-foreground">
                Saved weekly by coordinating with other parents
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoordinationTeaser;
