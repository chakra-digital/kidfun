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

        // Strategy 1: Prefer placeholder images for uniqueness (avoid duplicate OG images)
        const placeholderUrl = getPlaceholderImage(businessName, specialties, description);
        
        // Strategy 2: Only try website fetch if it's likely unique (has specific path/params)
        let websiteFetchUrl: string | null = null;
        if (websiteUrl && (websiteUrl.includes('?') || websiteUrl.split('/').length > 4)) {
          console.log('Attempting to fetch unique image from website:', websiteUrl);
          try {
            const { data, error: fetchError } = await supabase.functions.invoke(
              'fetch-provider-image',
              {
                body: { websiteUrl },
              }
            );

            if (!fetchError && data?.imageUrl) {
              console.log('Successfully fetched image from website');
              websiteFetchUrl = data.imageUrl;
            }
          } catch (err) {
            console.warn('Failed to fetch website image, using placeholder:', err);
          }
        }

        // Use website image only if it differs from placeholder, otherwise use placeholder for uniqueness
        finalImageUrl = websiteFetchUrl || placeholderUrl;

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
