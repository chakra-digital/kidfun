import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Calendar, Trash2, ExternalLink, Share2 } from 'lucide-react';
import { useSavedActivities } from '@/hooks/useSavedActivities';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { AddActivityDialog } from '@/components/activities/AddActivityDialog';
import { ShareActivityDialog } from '@/components/coordination/ShareActivityDialog';

const statusColors: Record<string, string> = {
  saved: 'bg-muted text-muted-foreground',
  interested: 'bg-primary/10 text-primary',
  booked: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
};

// Generate a provider URL with UTM params - use stored provider_url if available
const getProviderUrl = (activity: { provider_name: string; provider_url?: string | null }) => {
  if (activity.provider_url) {
    try {
      const url = new URL(activity.provider_url);
      url.searchParams.append('utm_source', 'kidfun');
      url.searchParams.append('utm_medium', 'saved_activity');
      url.searchParams.append('utm_campaign', 'provider_lookup');
      return url.toString();
    } catch {
      return activity.provider_url;
    }
  }
  // No URL stored - return null (won't be clickable)
  return null;
};

export const SavedActivitiesSection: React.FC = () => {
  const { savedActivities, loading, removeActivity, refetch } = useSavedActivities();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bookmark className="h-5 w-5" />
            My Activities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <CardTitle className="flex items-center gap-2 flex-shrink-0">
          <Bookmark className="h-5 w-5" />
          <span className="whitespace-nowrap">My Activities</span>
          {savedActivities.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {savedActivities.length}
            </Badge>
          )}
        </CardTitle>
        <div className="flex gap-2 flex-shrink-0">
          <AddActivityDialog onActivityAdded={refetch} />
          <Button asChild variant="outline" size="sm">
            <Link to="/">Discover</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {savedActivities.length === 0 ? (
          <div className="text-center py-8">
            <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No activities yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your kid's activities, classes, and events to keep everything in one place.
            </p>
            <AddActivityDialog onActivityAdded={refetch} />
          </div>
        ) : (
          <div className="space-y-3">
            {savedActivities.map((activity) => {
              // Determine the link: internal provider page or external website URL
              const hasInternalProvider = !!activity.provider_id;
              const externalUrl = hasInternalProvider 
                ? null 
                : getProviderUrl(activity);
              
              return (
                <div
                  key={activity.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {hasInternalProvider ? (
                        <Link 
                          to={`/provider/${activity.provider_id}`}
                          className="font-medium truncate hover:text-primary hover:underline block"
                        >
                          {activity.provider_name}
                        </Link>
                      ) : externalUrl ? (
                        <a 
                          href={externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium truncate hover:text-primary hover:underline flex items-center gap-1"
                        >
                          {activity.provider_name}
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      ) : (
                        <span className="font-medium truncate block">
                          {activity.provider_name}
                        </span>
                      )}
                      {activity.activity_name && (
                        <p className="text-sm text-muted-foreground truncate">
                          {activity.activity_name}
                        </p>
                      )}
                      {activity.notes && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {activity.notes}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge className={statusColors[activity.status] || statusColors.saved}>
                          {activity.status}
                        </Badge>
                        {activity.scheduled_date && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(activity.scheduled_date), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <ShareActivityDialog
                        providerId={activity.provider_id || undefined}
                        providerName={activity.provider_name}
                        activityName={activity.activity_name || undefined}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </ShareActivityDialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeActivity(activity.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
