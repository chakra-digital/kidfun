import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Child {
  id: string;
  parent_id: string;
  first_name: string;
  age: number;
  interests: string[] | null;
  allergies: string | null;
  special_needs: string | null;
  medical_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface UseChildrenReturn {
  children: Child[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useChildren = (): UseChildrenReturn => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChildren = async () => {
    if (!user) {
      setChildren([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("children")
        .select("*")
        .eq("parent_id", user.id)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      setChildren(data || []);
    } catch (err: any) {
      console.error("Error fetching children:", err);
      setError(err.message || "Failed to fetch children");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren();
  }, [user]);

  const refetch = () => {
    fetchChildren();
  };

  return {
    children,
    loading,
    error,
    refetch,
  };
};