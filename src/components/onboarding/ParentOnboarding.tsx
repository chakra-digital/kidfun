import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, MapPin, DollarSign, Clock, User } from "lucide-react";

interface ParentOnboardingProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  onSkip: () => void;
}

interface ChildProfile {
  firstName: string;
  age: number;
  interests: string[];
  allergies: string;
  specialNeeds: string;
  medicalNotes: string;
}

const INTEREST_OPTIONS = [
  "Sports", "Arts & Crafts", "Science", "Music", "Dance", "Swimming",
  "Soccer", "Basketball", "Tennis", "Theater", "Coding", "Cooking",
  "Nature", "Reading", "Games", "Photography", "Martial Arts"
];

export const ParentOnboarding: React.FC<ParentOnboardingProps> = ({
  currentStep,
  onStepChange,
  onComplete,
  onSkip
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Step 1: Location & Preferences
  const [location, setLocation] = useState("");
  const [budgetRange, setBudgetRange] = useState([0, 200]);
  const [preferredRadius, setPreferredRadius] = useState([10]);

  // Step 2: Emergency Contact
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");

  // Step 3: Children Profiles
  const [children, setChildren] = useState<ChildProfile[]>([{
    firstName: "",
    age: 5,
    interests: [],
    allergies: "",
    specialNeeds: "",
    medicalNotes: ""
  }]);

  // Step 4: Review & Complete
  
  const addChild = () => {
    setChildren([...children, {
      firstName: "",
      age: 5,
      interests: [],
      allergies: "",
      specialNeeds: "",
      medicalNotes: ""
    }]);
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const updateChild = (index: number, field: keyof ChildProfile, value: any) => {
    const updated = [...children];
    updated[index] = { ...updated[index], [field]: value };
    setChildren(updated);
  };

  const toggleInterest = (childIndex: number, interest: string) => {
    const child = children[childIndex];
    const interests = child.interests.includes(interest)
      ? child.interests.filter(i => i !== interest)
      : [...child.interests, interest];
    updateChild(childIndex, "interests", interests);
  };

  const handleNext = () => {
    if (currentStep < 4) {
      onStepChange(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      onStepChange(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Save parent profile
      const { error: parentError } = await supabase
        .from("parent_profiles")
        .upsert({
          user_id: user.id,
          location,
          budget_min: budgetRange[0],
          budget_max: budgetRange[1],
          preferred_radius: preferredRadius[0],
          emergency_contact_name: emergencyContactName,
          emergency_contact_phone: emergencyContactPhone,
        });

      if (parentError) throw parentError;

      // Save children profiles
      for (const child of children) {
        if (child.firstName.trim()) {
          const { error: childError } = await supabase
            .from("children")
            .insert({
              parent_id: user.id,
              first_name: child.firstName,
              age: child.age,
              interests: child.interests,
              allergies: child.allergies || null,
              special_needs: child.specialNeeds || null,
              medical_notes: child.medicalNotes || null,
            });

          if (childError) throw childError;
        }
      }

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return location.trim() !== "";
      case 2:
        return emergencyContactName.trim() !== "" && emergencyContactPhone.trim() !== "";
      case 3:
        return children.some(child => child.firstName.trim() !== "");
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2 text-primary" />
                Location & Preferences
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="location">Your Location</Label>
                  <Input
                    id="location"
                    placeholder="City, State or ZIP code"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Budget Range (per week)</Label>
                  <div className="mt-2">
                    <Slider
                      value={budgetRange}
                      onValueChange={setBudgetRange}
                      max={500}
                      min={0}
                      step={25}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>${budgetRange[0]}</span>
                      <span>${budgetRange[1]}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Preferred Travel Distance (miles)</Label>
                  <div className="mt-2">
                    <Slider
                      value={preferredRadius}
                      onValueChange={setPreferredRadius}
                      max={50}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-center text-sm text-muted-foreground mt-1">
                      {preferredRadius[0]} miles
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Emergency Contact
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="emergency-name">Emergency Contact Name</Label>
                  <Input
                    id="emergency-name"
                    placeholder="Full name"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="emergency-phone">Emergency Contact Phone</Label>
                  <Input
                    id="emergency-phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Children Profiles
              </h3>
              
              <div className="space-y-6">
                {children.map((child, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Child {index + 1}</h4>
                      {children.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChild(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>First Name</Label>
                          <Input
                            placeholder="Child's name"
                            value={child.firstName}
                            onChange={(e) => updateChild(index, "firstName", e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Age</Label>
                          <Input
                            type="number"
                            min="3"
                            max="18"
                            value={child.age}
                            onChange={(e) => updateChild(index, "age", parseInt(e.target.value) || 5)}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Interests</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {INTEREST_OPTIONS.map((interest) => (
                            <Badge
                              key={interest}
                              variant={child.interests.includes(interest) ? "default" : "outline"}
                              className="cursor-pointer"
                              onClick={() => toggleInterest(index, interest)}
                            >
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label>Allergies</Label>
                        <Input
                          placeholder="Food allergies, environmental allergies, etc."
                          value={child.allergies}
                          onChange={(e) => updateChild(index, "allergies", e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Special Needs</Label>
                        <Textarea
                          placeholder="Any special accommodations or considerations"
                          value={child.specialNeeds}
                          onChange={(e) => updateChild(index, "specialNeeds", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </Card>
                ))}

                <Button
                  variant="outline"
                  onClick={addChild}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Child
                </Button>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Review Your Profile</h3>
              
              <div className="space-y-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-2">Location & Preferences</h4>
                  <p className="text-sm text-muted-foreground">Location: {location}</p>
                  <p className="text-sm text-muted-foreground">Budget: ${budgetRange[0]} - ${budgetRange[1]} per week</p>
                  <p className="text-sm text-muted-foreground">Travel Distance: {preferredRadius[0]} miles</p>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2">Emergency Contact</h4>
                  <p className="text-sm text-muted-foreground">{emergencyContactName}</p>
                  <p className="text-sm text-muted-foreground">{emergencyContactPhone}</p>
                </Card>

                <Card className="p-4">
                  <h4 className="font-medium mb-2">Children ({children.filter(c => c.firstName.trim()).length})</h4>
                  {children.filter(c => c.firstName.trim()).map((child, index) => (
                    <div key={index} className="mb-2 last:mb-0">
                      <p className="text-sm font-medium">{child.firstName}, age {child.age}</p>
                      <p className="text-xs text-muted-foreground">
                        Interests: {child.interests.join(", ") || "None selected"}
                      </p>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderStep()}
      
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!canProceed() || loading}
        >
          {loading ? "Saving..." : currentStep === 4 ? "Complete Setup" : "Next"}
        </Button>
      </div>
    </div>
  );
};