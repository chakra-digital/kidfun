import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseProviderImageProps {
  providerId: string;
  businessName: string;
  specialties?: string[];
  description?: string;
  existingImageUrl?: string | null;
}

export const useProviderImage = ({
  providerId,
  businessName,
  specialties,
  description,
  existingImageUrl,
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

    const generateImage = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: functionError } = await supabase.functions.invoke(
          'generate-provider-image',
          {
            body: {
              businessName,
              specialties,
              description,
            },
          }
        );

        if (functionError) throw functionError;

        if (data?.imageUrl) {
          setImageUrl(data.imageUrl);

          // Store the generated image URL in the database
          const { error: updateError } = await supabase
            .from('provider_profiles')
            .update({ image_url: data.imageUrl })
            .eq('id', providerId);

          if (updateError) {
            console.error('Failed to save image URL to database:', updateError);
          }
        }
      } catch (err: any) {
        console.error('Error generating provider image:', err);
        setError(err.message || 'Failed to generate image');
      } finally {
        setLoading(false);
      }
    };

    generateImage();
  }, [providerId, businessName, specialties, description, existingImageUrl]);

  return { imageUrl, loading, error };
};
