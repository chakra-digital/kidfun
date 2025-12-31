import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Check, X, UserPlus, Mail, Clock } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useActivityCoordination, ActivityMessage } from '@/hooks/useActivityCoordination';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export const ActivityInbox = () => {
  const { user } = useAuth();
  const { messages, loading, unreadCount, respondToRequest, markAsRead } = useActivityCoordination();

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'join_request': return <UserPlus className="h-4 w-4" />;
      case 'invite': return <Mail className="h-4 w-4" />;
      case 'accepted': return <Check className="h-4 w-4 text-green-500" />;
      case 'declined': return <X className="h-4 w-4 text-red-500" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getMessageLabel = (type: string, isIncoming: boolean) => {
    switch (type) {
      case 'join_request': return isIncoming ? 'Join Request' : 'Request Sent';
      case 'invite': return isIncoming ? 'Invitation' : 'Invite Sent';
      case 'accepted': return 'Accepted';
      case 'declined': return 'Declined';
      default: return 'Message';
    }
  };

  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const handleRespond = async (messageId: string, response: 'accepted' | 'declined') => {
    setRespondingTo(messageId);
    const result = await respondToRequest(messageId, response);
    if (!result.error) {
      await markAsRead(messageId);
    }
    setRespondingTo(null);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Activity Messages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Activity Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              No messages yet. Share activities with your connections!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-3 pr-4">
              {messages.map((message) => {
                const isIncoming = message.recipient_id === user?.id;
                const isUnread = isIncoming && !message.read_at;
                // Allow response for invite/join_request messages that are incoming and unread (not responded yet)
                const isActionableType = message.message_type === 'join_request' || message.message_type === 'invite';
                const canRespond = isIncoming && isActionableType && !message.read_at;
                const isResponding = respondingTo === message.id;

                return (
                  <div 
                    key={message.id}
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      isUnread ? "bg-primary/5 border-primary/20" : "bg-background"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                        isIncoming ? "bg-primary/10" : "bg-muted"
                      )}>
                        {getMessageIcon(message.message_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {getMessageLabel(message.message_type, isIncoming)}
                          </Badge>
                          {isUnread && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        
                        <p className="text-sm line-clamp-2">{message.message}</p>
                        
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </p>
                        
                        {/* Response buttons */}
                        {canRespond && (
                          <div className="flex gap-2 mt-2">
                            <Button 
                              size="sm" 
                              disabled={isResponding}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRespond(message.id, 'accepted');
                              }}
                            >
                              <Check className="h-3 w-3 mr-1" />
                              {isResponding ? 'Accepting...' : 'Accept'}
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={isResponding}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRespond(message.id, 'declined');
                              }}
                            >
                              <X className="h-3 w-3 mr-1" />
                              {isResponding ? 'Declining...' : 'Decline'}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
