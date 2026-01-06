import { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar as CalendarIcon, Plus, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSocialConnections } from '@/hooks/useSocialConnections';

interface CreateThreadDialogProps {
  onCreateThread: (
    activityName: string,
    inviteUserIds: string[],
    options?: {
      providerName?: string;
      providerUrl?: string;
      location?: string;
      notes?: string;
      proposedDate?: Date;
    }
  ) => Promise<string | null>;
  // Pre-fill from activity discovery
  prefill?: {
    activityName?: string;
    providerName?: string;
    providerUrl?: string;
    location?: string;
  };
  trigger?: React.ReactNode;
}

export function CreateThreadDialog({ onCreateThread, prefill, trigger }: CreateThreadDialogProps) {
  const [open, setOpen] = useState(false);
  const [activityName, setActivityName] = useState(prefill?.activityName ?? '');
  const [providerName, setProviderName] = useState(prefill?.providerName ?? '');
  const [location, setLocation] = useState(prefill?.location ?? '');
  const [notes, setNotes] = useState('');
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [proposedDate, setProposedDate] = useState<Date | undefined>();
  const [proposedTime, setProposedTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { connections, loading: loadingConnections } = useSocialConnections();
  const acceptedConnections = connections.filter(c => c.status === 'accepted');

  const toggleConnection = (userId: string) => {
    setSelectedConnections(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (!activityName.trim()) return;

    setIsSubmitting(true);
    
    // Combine date and time if both provided
    let fullDate: Date | undefined;
    if (proposedDate && proposedTime) {
      const [hours, minutes] = proposedTime.split(':').map(Number);
      fullDate = new Date(proposedDate);
      fullDate.setHours(hours, minutes, 0, 0);
    }

    const threadId = await onCreateThread(
      activityName,
      selectedConnections,
      {
        providerName: providerName || undefined,
        providerUrl: prefill?.providerUrl,
        location: location || undefined,
        notes: notes || undefined,
        proposedDate: fullDate
      }
    );

    if (threadId) {
      setOpen(false);
      resetForm();
    }
    
    setIsSubmitting(false);
  };

  const resetForm = () => {
    setActivityName(prefill?.activityName ?? '');
    setProviderName(prefill?.providerName ?? '');
    setLocation(prefill?.location ?? '');
    setNotes('');
    setSelectedConnections([]);
    setProposedDate(undefined);
    setProposedTime('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Plan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create a Plan</DialogTitle>
          <DialogDescription>
            Start coordinating an activity with your connections
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4 -mr-4">
          <div className="space-y-4 py-4">
            {/* Activity Name */}
            <div className="space-y-2">
              <Label htmlFor="activityName">Activity Name *</Label>
              <Input
                id="activityName"
                placeholder="e.g., Soccer Practice, Art Class, Playdate"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
              />
            </div>

            {/* Provider/Venue */}
            <div className="space-y-2">
              <Label htmlFor="providerName">Venue / Provider (optional)</Label>
              <Input
                id="providerName"
                placeholder="e.g., ABC Sports Center"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                placeholder="e.g., 123 Main St"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Invite Connections */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Invite Connections
              </Label>
              {loadingConnections ? (
                <p className="text-sm text-muted-foreground">Loading connections...</p>
              ) : acceptedConnections.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No connections yet. Connect with other parents first!
                </p>
              ) : (
                <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                  {acceptedConnections.map((connection) => {
                    const otherUserId = connection.connected_parent_id;
                    return (
                      <div
                        key={otherUserId}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleConnection(otherUserId)}
                      >
                        <Checkbox
                          checked={selectedConnections.includes(otherUserId)}
                          onCheckedChange={() => toggleConnection(otherUserId)}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10">
                            {connection.profile?.first_name?.[0] ?? '?'}
                            {connection.profile?.last_name?.[0] ?? ''}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {connection.profile?.first_name} {connection.profile?.last_name}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {selectedConnections.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedConnections.length} selected
                </p>
              )}
            </div>

            {/* Propose Time (optional) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Propose a Time (optional)
              </Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left font-normal",
                        !proposedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {proposedDate ? format(proposedDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={proposedDate}
                      onSelect={setProposedDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Input
                  type="time"
                  value={proposedTime}
                  onChange={(e) => setProposedTime(e.target.value)}
                  className="w-[120px]"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Any additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!activityName.trim() || isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
