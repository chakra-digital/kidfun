import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit } from "lucide-react";
import { SchoolInput } from "@/components/ui/school-input";

export const EditProfileDialog = () => {
  const { user } = useAuth();
  const { userProfile, parentProfile, refreshProfile } = useUserProfile();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: ""
  });

  const [parentFormData, setParentFormData] = useState({
    school_name: "",
    school_place_id: "",
    neighborhood: ""
  });

  const isParent = userProfile?.user_type === 'parent';

  useEffect(() => {
    if (userProfile) {
      setFormData({
        first_name: userProfile.first_name || "",
        last_name: userProfile.last_name || "",
        phone: userProfile.phone || ""
      });
    }
    if (parentProfile) {
      setParentFormData({
        school_name: parentProfile.school_name || "",
        school_place_id: parentProfile.school_place_id || "",
        neighborhood: parentProfile.neighborhood || ""
      });
    }
  }, [userProfile, parentProfile]);

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Update main profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Update parent profile if user is a parent
      if (isParent) {
        const { error: parentError } = await supabase
          .from("parent_profiles")
          .update({
            school_name: parentFormData.school_name || null,
            school_place_id: parentFormData.school_place_id || null,
            neighborhood: parentFormData.neighborhood || null
          })
          .eq("user_id", user.id);

        if (parentError) throw parentError;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });

      refreshProfile();
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolChange = (name: string, placeId: string | null) => {
    setParentFormData(prev => ({
      ...prev,
      school_name: name,
      school_place_id: placeId || ""
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          {isParent && (
            <>
              <div>
                <Label htmlFor="school">School</Label>
                <SchoolInput
                  value={parentFormData.school_name}
                  onChange={handleSchoolChange}
                  placeholder="Search for your child's school..."
                />
              </div>

              <div>
                <Label htmlFor="neighborhood">Neighborhood</Label>
                <Input
                  id="neighborhood"
                  value={parentFormData.neighborhood}
                  onChange={(e) => setParentFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                  placeholder="e.g., Tarrytown, Hyde Park"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
