import { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProposeTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadId: string;
  activityName: string;
  onPropose: (threadId: string, date: Date, notes?: string) => Promise<boolean>;
}

export function ProposeTimeDialog({
  open,
  onOpenChange,
  threadId,
  activityName,
  onPropose
}: ProposeTimeDialogProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!date || !time) return;

    setIsSubmitting(true);

    const [hours, minutes] = time.split(':').map(Number);
    const fullDate = new Date(date);
    fullDate.setHours(hours, minutes, 0, 0);

    const success = await onPropose(threadId, fullDate, notes || undefined);
    
    if (success) {
      onOpenChange(false);
      setDate(undefined);
      setTime('');
      setNotes('');
    }
    
    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Propose a Time</DialogTitle>
          <DialogDescription>
            Suggest when to do "{activityName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Time *</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="e.g., 'Works best for us!'"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!date || !time || isSubmitting}
          >
            {isSubmitting ? 'Proposing...' : 'Propose Time'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
