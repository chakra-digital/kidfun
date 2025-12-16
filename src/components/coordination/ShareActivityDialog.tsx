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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Share2, Users, Send, Check, X } from 'lucide-react';
import { useSocialConnections } from '@/hooks/useSocialConnections';
import { useActivityCoordination } from '@/hooks/useActivityCoordination';
import { useSavedActivities } from '@/hooks/useSavedActivities';
import { cn } from '@/lib/utils';

interface ShareActivityDialogProps {
  providerId?: string;
  providerName: string;
  activityName?: string;
  providerUrl?: string; // External website URL to store when saving
  children?: React.ReactNode;
}

export const ShareActivityDialog: React.FC<ShareActivityDialogProps> = ({
  providerId,
  providerName,
  activityName,
  providerUrl,
  children
}) => {
  const { connections, loading: connectionsLoading } = useSocialConnections();
  const { sendInvite } = useActivityCoordination();
  const { savedActivities, saveActivity } = useSavedActivities();
  
  const [open, setOpen] = useState(false);
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Check if already saved
  const existingActivity = savedActivities.find(
    a => a.provider_id === providerId || a.provider_name === providerName
  );

  const toggleConnection = (userId: string) => {
    setSelectedConnections(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleShare = async () => {
    if (selectedConnections.length === 0) return;
    
    setSending(true);
    
    try {
      // First save the activity if not already saved
      let activityId = existingActivity?.id;
      if (!activityId) {
        const result = await saveActivity(providerId || null, providerName, activityName, 'saved', providerUrl);
        activityId = result.data?.id;
      }

      // Send invites to selected connections
      for (const connectionId of selectedConnections) {
        await sendInvite(
          activityId || null,
          connectionId,
          providerName,
          message || `I thought you might be interested in ${providerName}!`
        );
      }
      
      setOpen(false);
      setSelectedConnections([]);
      setMessage('');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="z-[200] max-w-md" overlayClassName="z-[200]">
        <DialogHeader>
          <DialogTitle>Share Activity</DialogTitle>
          <DialogDescription>
            Invite your connections to {providerName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Activity preview */}
          <div className="p-3 rounded-lg bg-muted">
            <p className="font-medium">{providerName}</p>
            {activityName && (
              <p className="text-sm text-muted-foreground">{activityName}</p>
            )}
          </div>
          
          {/* Connection selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Select connections to invite
            </label>
            {connectionsLoading ? (
              <div className="animate-pulse h-32 bg-muted rounded" />
            ) : connections.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No connections yet</p>
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
              Add a message (optional)
            </label>
            <Textarea
              placeholder={`I thought you might be interested in ${providerName}!`}
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
            <Send className="h-4 w-4 mr-1" />
            {sending ? 'Sending...' : `Send to ${selectedConnections.length}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
