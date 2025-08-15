import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

const INTEREST_OPTIONS = [
  "Sports", "Arts & Crafts", "Science", "Music", "Dance", "Reading", 
  "Swimming", "Soccer", "Basketball", "Tennis", "Gymnastics", "Martial Arts",
  "Photography", "Cooking", "Gaming", "Nature", "Animals", "Technology"
];

interface AddChildFormProps {
  onChildAdded: () => void;
}

const AddChildForm = ({ onChildAdded }: AddChildFormProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    age: [5],
    interests: [] as string[],
    allergies: "",
    special_needs: "",
    medical_notes: ""
  });

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.first_name.trim()) {
      toast.error("Please enter the child's name");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("children")
        .insert({
          parent_id: user.id,
          first_name: formData.first_name.trim(),
          age: formData.age[0],
          interests: formData.interests.length > 0 ? formData.interests : null,
          allergies: formData.allergies.trim() || null,
          special_needs: formData.special_needs.trim() || null,
          medical_notes: formData.medical_notes.trim() || null
        });

      if (error) throw error;

      toast.success("Child profile added successfully!");
      setFormData({
        first_name: "",
        age: [5],
        interests: [],
        allergies: "",
        special_needs: "",
        medical_notes: ""
      });
      setOpen(false);
      onChildAdded();
    } catch (error: any) {
      console.error("Error adding child:", error);
      toast.error("Failed to add child profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Child Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Child Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="first_name">Child's Name *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              placeholder="Enter child's first name"
              required
            />
          </div>

          <div>
            <Label>Age: {formData.age[0]} years old</Label>
            <Slider
              value={formData.age}
              onValueChange={(value) => setFormData(prev => ({ ...prev, age: value }))}
              max={18}
              min={3}
              step={1}
              className="mt-2"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>3 years</span>
              <span>18 years</span>
            </div>
          </div>

          <div>
            <Label>Interests (select all that apply)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {INTEREST_OPTIONS.map((interest) => (
                <Badge
                  key={interest}
                  variant={formData.interests.includes(interest) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                  {formData.interests.includes(interest) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="allergies">Allergies</Label>
            <Textarea
              id="allergies"
              value={formData.allergies}
              onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
              placeholder="List any allergies (food, environmental, etc.)"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="special_needs">Special Needs</Label>
            <Textarea
              id="special_needs"
              value={formData.special_needs}
              onChange={(e) => setFormData(prev => ({ ...prev, special_needs: e.target.value }))}
              placeholder="Any special needs or accommodations"
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="medical_notes">Medical Notes</Label>
            <Textarea
              id="medical_notes"
              value={formData.medical_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, medical_notes: e.target.value }))}
              placeholder="Any additional medical information"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Child"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddChildForm;