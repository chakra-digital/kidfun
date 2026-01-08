import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Share2, Users, Send, Check, CalendarPlus } from 'lucide-react';
import { useSocialConnections } from '@/hooks/useSocialConnections';
import { useCoordinationThreads } from '@/hooks/useCoordinationThreads';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ShareActivityDialogProps {
  providerId?: string;
  providerName: string;
  activityName?: string;
  providerUrl?: string;
  children?: React.ReactNode;
  // If true, this is a "Plan with Friends" action vs simple share
  isPlanAction?: boolean;
}

export const ShareActivityDialog: React.FC<ShareActivityDialogProps> = ({
  providerId,
  providerName,
  activityName,
  providerUrl,
  children,
  isPlanAction = false
}) => {
  const { connections, loading: connectionsLoading } = useSocialConnections();
  const { createThread } = useCoordinationThreads();
  
  const [open, setOpen] = useState(false);
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const toggleConnection = (userId: string) => {
    setSelectedConnections(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShare = async () => {
    if (selectedConnections.length === 0) {
      toast.error('Please select at least one connection');
      return;
    }
    
    setSending(true);
    
    try {
      // Create a coordination thread with the selected connections
      const displayName = activityName || providerName;
      const threadId = await createThread(
        displayName,
        selectedConnections,
        {
          providerId: providerId || undefined,
          providerName: providerName,
          providerUrl: providerUrl,
          notes: message || undefined
        }
      );

      if (threadId) {
        toast.success(
          isPlanAction 
            ? 'Plan created! Your friends will be notified.'
            : 'Activity shared! Check Coordination to set a time.'
        );
        setOpen(false);
        setSelectedConnections([]);
        setMessage('');
      } else {
        toast.error('Failed to create plan. Please try again.');
      }
    } catch (error) {
      console.error('Error sharing activity:', error);
      toast.error('Something went wrong');
    } finally {
      setSending(false);
    }
  };

  const title = isPlanAction ? 'Plan with Friends' : 'Share Activity';
  const description = isPlanAction 
    ? `Start coordinating ${providerName} with your connections`
    : `Invite friends to ${providerName}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            {isPlanAction ? (
              <>
                <CalendarPlus className="h-4 w-4 mr-1" />
                Plan
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-1" />
                Share
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="z-[200] max-w-md" overlayClassName="z-[200]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Activity preview */}
          <div className="p-3 rounded-lg bg-muted">
            <p className="font-medium">{providerName}</p>
            {activityName && activityName !== providerName && (
              <p className="text-sm text-muted-foreground">{activityName}</p>
            )}
          </div>
          
          {/* Connection selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Who do you want to invite?
            </label>
            {connectionsLoading ? (
              <div className="animate-pulse h-32 bg-muted rounded" />
            ) : connections.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No connections yet</p>
                <p className="text-xs mt-1">Connect with other parents first</p>
              </div>
            ) : (
              <ScrollArea className="h-[150px] border rounded-md p-2">
                <div className="space-y-2">
                  {connections.map((connection) => {
                    const isSelected = selectedConnections.includes(connection.connected_parent_id);
                    return (
                      <button
                        key={connection.id}
                        type="button"
                        className={cn(
                          "w-full p-2 rounded-lg flex items-center justify-between transition-colors",
                          isSelected 
                            ? "bg-primary/10 border border-primary/30" 
                            : "hover:bg-muted border border-transparent"
                        )}
                        onClick={() => toggleConnection(connection.connected_parent_id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-4 w-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">
                            {connection.profile?.first_name} {connection.profile?.last_name}
                          </span>
                        </div>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
          
          {/* Message */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Add a note (optional)
            </label>
            <Textarea
              placeholder={`What are you thinking for ${providerName}?`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleShare}
            disabled={selectedConnections.length === 0 || sending}
          >
            {isPlanAction ? (
              <CalendarPlus className="h-4 w-4 mr-1" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            {sending 
              ? 'Creating...' 
              : isPlanAction 
                ? `Start Plan (${selectedConnections.length})`
                : `Share (${selectedConnections.length})`
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
