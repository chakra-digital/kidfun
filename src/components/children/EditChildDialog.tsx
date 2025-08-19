import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Child {
  id: string;
  first_name: string;
  age: number;
  interests: string[] | null;
  allergies: string | null;
  special_needs: string | null;
  medical_notes: string | null;
}

interface EditChildDialogProps {
  child: Child;
  onChildUpdated: () => void;
}

const INTEREST_OPTIONS = [
  "Sports", "Arts & Crafts", "Science", "Music", "Dance", "Swimming",
  "Soccer", "Basketball", "Tennis", "Theater", "Coding", "Cooking",
  "Nature", "Reading", "Games", "Photography", "Martial Arts"
];

export const EditChildDialog: React.FC<EditChildDialogProps> = ({ child, onChildUpdated }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: child.first_name,
    age: child.age,
    interests: child.interests || [],
    allergies: child.allergies || "",
    special_needs: child.special_needs || "",
    medical_notes: child.medical_notes || "",
  });

  const toggleInterest = (interest: string) => {
    const interests = formData.interests.includes(interest)
      ? formData.interests.filter(i => i !== interest)
      : [...formData.interests, interest];
    setFormData(prev => ({ ...prev, interests }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("children")
        .update({
          first_name: formData.first_name,
          age: formData.age,
          interests: formData.interests,
          allergies: formData.allergies || null,
          special_needs: formData.special_needs || null,
          medical_notes: formData.medical_notes || null,
        })
        .eq("id", child.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Child profile updated successfully",
      });

      setOpen(false);
      onChildUpdated();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update child profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {child.first_name}'s Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                className="mt-1"
                required
              />
            </div>
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min="3"
                max="18"
                value={formData.age}
                onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 5 }))}
                className="mt-1"
                required
              />
            </div>
          </div>

          <div>
            <Label>Interests</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {INTEREST_OPTIONS.map((interest) => (
                <Badge
                  key={interest}
                  variant={formData.interests.includes(interest) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="allergies">Allergies</Label>
            <Input
              id="allergies"
              placeholder="Food allergies, environmental allergies, etc."
              value={formData.allergies}
              onChange={(e) => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="special_needs">Special Needs</Label>
            <Textarea
              id="special_needs"
              placeholder="Any special accommodations or considerations"
              value={formData.special_needs}
              onChange={(e) => setFormData(prev => ({ ...prev, special_needs: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="medical_notes">Medical Notes</Label>
            <Textarea
              id="medical_notes"
              placeholder="Any additional medical information"
              value={formData.medical_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, medical_notes: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};