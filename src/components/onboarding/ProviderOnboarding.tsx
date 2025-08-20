import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Building, MapPin, DollarSign, Users, Shield } from "lucide-react";
import { LocationInput } from "@/components/ui/location-input";

interface ProviderOnboardingProps {
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  onSkip: () => void;
}

const AGE_GROUPS = [
  "Toddlers (2-3)", "Preschool (4-5)", "Elementary (6-10)", 
  "Middle School (11-13)", "High School (14-18)"
];

const SPECIALTIES = [
  "Sports", "Arts & Crafts", "Science/STEM", "Music", "Dance", "Swimming",
  "Soccer", "Basketball", "Tennis", "Theater", "Coding", "Cooking",
  "Nature/Outdoor", "Academic Tutoring", "Special Needs", "Photography"
];

const AMENITIES = [
  "Indoor Facility", "Outdoor Space", "Pool", "Gym", "Art Studio",
  "Music Room", "Computer Lab", "Kitchen", "Air Conditioning",
  "Parking Available", "Public Transportation", "Lunch Provided"
];

export const ProviderOnboarding: React.FC<ProviderOnboardingProps> = ({
  currentStep,
  onStepChange,
  onComplete,
  onSkip
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Step 1: Business Information
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  // Step 2: Services & Specialties
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [capacity, setCapacity] = useState(10);

  // Step 3: Pricing & Availability
  const [basePrice, setBasePrice] = useState(50);
  const [pricingModel, setPricingModel] = useState("");

  // Step 4: Facilities & Amenities
  const [amenities, setAmenities] = useState<string[]>([]);

  // Step 5: Credentials & Verification
  const [yearsExperience, setYearsExperience] = useState(1);
  const [licenseNumber, setLicenseNumber] = useState("");

  const toggleArrayItem = (array: string[], setArray: (arr: string[]) => void, item: string) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
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
      const { error } = await supabase
        .from("provider_profiles")
        .upsert({
          user_id: user.id,
          business_name: businessName,
          location,
          description,
          age_groups: ageGroups,
          specialties,
          capacity,
          base_price: basePrice,
          pricing_model: pricingModel,
          amenities,
          years_experience: yearsExperience,
          license_number: licenseNumber || null,
          background_check_verified: false,
          insurance_verified: false,
        });

      if (error) throw error;

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
        return businessName.trim() !== "" && location.trim() !== "";
      case 2:
        return ageGroups.length > 0 && specialties.length > 0;
      case 3:
        return pricingModel !== "" && basePrice > 0;
      case 4:
        return true; // Amenities are optional
      case 5:
        return yearsExperience >= 0;
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
                <Building className="h-5 w-5 mr-2 text-primary" />
                Business Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="business-name">Business/Program Name</Label>
                  <Input
                    id="business-name"
                    placeholder="e.g., Sunny Days Camp, ABC Sports Academy"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <LocationInput
                    value={location}
                    onChange={setLocation}
                    placeholder="Enter your business address"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Program Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your programs, philosophy, and what makes your offering unique..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
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
                <Users className="h-5 w-5 mr-2 text-primary" />
                Services & Specialties
              </h3>
              
              <div className="space-y-6">
                <div>
                  <Label>Age Groups Served</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {AGE_GROUPS.map((ageGroup) => (
                      <Badge
                        key={ageGroup}
                        variant={ageGroups.includes(ageGroup) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem(ageGroups, setAgeGroups, ageGroup)}
                      >
                        {ageGroup}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Program Specialties</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {SPECIALTIES.map((specialty) => (
                      <Badge
                        key={specialty}
                        variant={specialties.includes(specialty) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleArrayItem(specialties, setSpecialties, specialty)}
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="capacity">Maximum Capacity (children)</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="100"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 10)}
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
                <DollarSign className="h-5 w-5 mr-2 text-primary" />
                Pricing & Availability
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="pricing-model">Pricing Model</Label>
                  <Select value={pricingModel} onValueChange={setPricingModel}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select pricing model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly Rate</SelectItem>
                      <SelectItem value="daily">Daily Rate</SelectItem>
                      <SelectItem value="weekly">Weekly Rate</SelectItem>
                      <SelectItem value="monthly">Monthly Rate</SelectItem>
                      <SelectItem value="session">Per Session</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="base-price">Base Price ($)</Label>
                  <Input
                    id="base-price"
                    type="number"
                    min="1"
                    value={basePrice}
                    onChange={(e) => setBasePrice(parseInt(e.target.value) || 50)}
                    className="mt-1"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {pricingModel && `Price per ${pricingModel.replace('ly', '').replace('session', 'session')}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Building className="h-5 w-5 mr-2 text-primary" />
                Facilities & Amenities
              </h3>
              
              <div>
                <Label>Available Amenities</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {AMENITIES.map((amenity) => (
                    <Badge
                      key={amenity}
                      variant={amenities.includes(amenity) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleArrayItem(amenities, setAmenities, amenity)}
                    >
                      {amenity}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Select all amenities that apply to your facility
                </p>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Credentials & Experience
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="years-experience">Years of Experience</Label>
                  <Input
                    id="years-experience"
                    type="number"
                    min="0"
                    max="50"
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="license-number">License Number (if applicable)</Label>
                  <Input
                    id="license-number"
                    placeholder="Professional license, certification, etc."
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <Card className="p-4 bg-muted/50">
                  <h4 className="font-medium mb-2">Verification Process</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    After setup, you'll be able to upload documentation for:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Background check verification</li>
                    <li>• Insurance documentation</li>
                    <li>• Professional certifications</li>
                    <li>• Business licenses</li>
                  </ul>
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
          {loading ? "Saving..." : currentStep === 5 ? "Complete Setup" : "Next"}
        </Button>
      </div>
    </div>
  );
};