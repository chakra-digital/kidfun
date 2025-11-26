import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPlaceholderImage } from "@/lib/placeholderImages";

interface UseProviderImageProps {
  providerId: string;
  businessName: string;
  specialties?: string[];
  description?: string;
  existingImageUrl?: string | null;
  websiteUrl?: string | null;
}

export const useProviderImage = ({
  providerId,
  businessName,
  specialties,
  description,
  existingImageUrl,
  websiteUrl,
}: UseProviderImageProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(existingImageUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If we already have an image URL, use it
    if (existingImageUrl) {
      setImageUrl(existingImageUrl);
      return;
    }

    const fetchImage = async () => {
      setLoading(true);
      setError(null);

      try {
        let finalImageUrl: string | null = null;

        // Strategy 1: Try to fetch from provider's website (if URL available)
        if (websiteUrl) {
          console.log('Attempting to fetch image from website:', websiteUrl);
          try {
            const { data, error: fetchError } = await supabase.functions.invoke(
              'fetch-provider-image',
              {
                body: { websiteUrl },
              }
            );

            if (!fetchError && data?.imageUrl) {
              console.log('Successfully fetched image from website');
              finalImageUrl = data.imageUrl;
            }
          } catch (err) {
            console.warn('Failed to fetch website image, falling back to placeholder:', err);
          }
        }

        // Strategy 2: Use static placeholder based on activity type
        if (!finalImageUrl) {
          console.log('Using placeholder image based on activity category');
          finalImageUrl = getPlaceholderImage(businessName, specialties, description);
        }

        setImageUrl(finalImageUrl);

        // Store the fetched image URL in the database for future use
        // Only update if this is a UUID (existing provider), not a google_place_id
        if (finalImageUrl && providerId && providerId.length === 36 && providerId.includes('-')) {
          const { error: updateError } = await supabase
            .from('provider_profiles')
            .update({ image_url: finalImageUrl })
            .eq('id', providerId);

          if (updateError) {
            console.error('Failed to save image URL to database:', updateError);
          }
        }
      } catch (err: any) {
        console.error('Error fetching provider image:', err);
        // Even on error, fall back to placeholder
        const placeholderUrl = getPlaceholderImage(businessName, specialties, description);
        setImageUrl(placeholderUrl);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();
  }, [providerId, businessName, specialties, description, existingImageUrl, websiteUrl]);

  return { imageUrl, loading, error };
};
