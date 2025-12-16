import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AddActivityDialogProps {
  onActivityAdded?: () => void;
}

export const AddActivityDialog: React.FC<AddActivityDialogProps> = ({ onActivityAdded }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Simple form state - manual entry
  const [activityName, setActivityName] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState<Date | undefined>();
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activityName.trim()) return;

    setSaving(true);
    try {
      // Combine location and notes
      const combinedNotes = [location.trim(), notes.trim()].filter(Boolean).join(' • ') || null;
      
      const { error } = await supabase.from('saved_activities').insert({
        user_id: user.id,
        provider_name: activityName.trim(),
        activity_name: null,
        scheduled_date: date?.toISOString() || null,
        notes: combinedNotes,
        status: 'saved',
        provider_id: null
      });

      if (error) throw error;

      toast.success('Activity added! +10 points 🎉');
      resetForm();
      setOpen(false);
      onActivityAdded?.();
    } catch (err) {
      console.error('Error saving activity:', err);
      toast.error('Failed to save activity');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setActivityName('');
    setLocation('');
    setDate(undefined);
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Activity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Activity</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Activity Name - Required */}
          <div className="space-y-2">
            <Label htmlFor="activity-name">Activity or Place Name *</Label>
            <Input
              id="activity-name"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="Soccer practice, Art class, Birthday party..."
              autoComplete="off"
            />
          </div>

          {/* Location - Optional */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Austin, TX or venue name..."
            />
          </div>

          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date (optional)</Label>
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
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any details to remember..."
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!activityName.trim() || saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Activity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
