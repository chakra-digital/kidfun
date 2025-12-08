export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity_participants: {
        Row: {
          activity_id: string
          child_id: string | null
          id: string
          joined_at: string
          notes: string | null
          parent_id: string
          status: string
        }
        Insert: {
          activity_id: string
          child_id?: string | null
          id?: string
          joined_at?: string
          notes?: string | null
          parent_id: string
          status?: string
        }
        Update: {
          activity_id?: string
          child_id?: string | null
          id?: string
          joined_at?: string
          notes?: string | null
          parent_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_participants_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "group_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_participants_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_shares: {
        Row: {
          activity_name: string
          created_at: string
          group_id: string | null
          id: string
          provider_id: string | null
          provider_name: string | null
          rating: number | null
          recommendation_note: string | null
          shared_by: string
          shared_with: string | null
        }
        Insert: {
          activity_name: string
          created_at?: string
          group_id?: string | null
          id?: string
          provider_id?: string | null
          provider_name?: string | null
          rating?: number | null
          recommendation_note?: string | null
          shared_by: string
          shared_with?: string | null
        }
        Update: {
          activity_name?: string
          created_at?: string
          group_id?: string | null
          id?: string
          provider_id?: string | null
          provider_name?: string | null
          rating?: number | null
          recommendation_note?: string | null
          shared_by?: string
          shared_with?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_shares_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "social_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          age: number
          allergies: string | null
          created_at: string
          first_name: string
          id: string
          interests: string[] | null
          medical_notes: string | null
          parent_id: string
          special_needs: string | null
          updated_at: string
        }
        Insert: {
          age: number
          allergies?: string | null
          created_at?: string
          first_name: string
          id?: string
          interests?: string[] | null
          medical_notes?: string | null
          parent_id: string
          special_needs?: string | null
          updated_at?: string
        }
        Update: {
          age?: number
          allergies?: string | null
          created_at?: string
          first_name?: string
          id?: string
          interests?: string[] | null
          medical_notes?: string | null
          parent_id?: string
          special_needs?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      group_activities: {
        Row: {
          activity_name: string
          activity_type: string | null
          cost_per_child: number | null
          created_at: string
          created_by: string
          current_participants: number | null
          description: string | null
          group_id: string
          id: string
          location: string | null
          max_participants: number | null
          provider_id: string | null
          scheduled_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          activity_name: string
          activity_type?: string | null
          cost_per_child?: number | null
          created_at?: string
          created_by: string
          current_participants?: number | null
          description?: string | null
          group_id: string
          id?: string
          location?: string | null
          max_participants?: number | null
          provider_id?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          activity_name?: string
          activity_type?: string | null
          cost_per_child?: number | null
          created_at?: string
          created_by?: string
          current_participants?: number | null
          description?: string | null
          group_id?: string
          id?: string
          location?: string | null
          max_participants?: number | null
          provider_id?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_activities_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "social_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_memberships: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          parent_id: string
          role: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          parent_id: string
          role?: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          parent_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_memberships_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "social_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_connections: {
        Row: {
          connected_parent_id: string
          connection_type: string | null
          created_at: string
          id: string
          parent_id: string
          status: string
          updated_at: string
        }
        Insert: {
          connected_parent_id: string
          connection_type?: string | null
          created_at?: string
          id?: string
          parent_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          connected_parent_id?: string
          connection_type?: string | null
          created_at?: string
          id?: string
          parent_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      parent_profiles: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          location: string | null
          neighborhood: string | null
          preferred_radius: number | null
          referral_code: string | null
          school_name: string | null
          school_place_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          location?: string | null
          neighborhood?: string | null
          preferred_radius?: number | null
          referral_code?: string | null
          school_name?: string | null
          school_place_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          location?: string | null
          neighborhood?: string | null
          preferred_radius?: number | null
          referral_code?: string | null
          school_name?: string | null
          school_place_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      provider_profiles: {
        Row: {
          age_groups: string[] | null
          amenities: string[] | null
          background_check_verified: boolean | null
          base_price: number | null
          business_name: string
          capacity: number | null
          created_at: string
          description: string | null
          external_website: string | null
          google_place_id: string | null
          google_rating: number | null
          google_reviews_count: number | null
          id: string
          image_url: string | null
          insurance_verified: boolean | null
          latitude: number | null
          license_number: string | null
          location: string
          longitude: number | null
          phone: string | null
          pricing_model: string | null
          specialties: string[] | null
          updated_at: string
          user_id: string | null
          verification_status: string | null
          years_experience: number | null
        }
        Insert: {
          age_groups?: string[] | null
          amenities?: string[] | null
          background_check_verified?: boolean | null
          base_price?: number | null
          business_name: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          external_website?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_reviews_count?: number | null
          id?: string
          image_url?: string | null
          insurance_verified?: boolean | null
          latitude?: number | null
          license_number?: string | null
          location: string
          longitude?: number | null
          phone?: string | null
          pricing_model?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string | null
          verification_status?: string | null
          years_experience?: number | null
        }
        Update: {
          age_groups?: string[] | null
          amenities?: string[] | null
          background_check_verified?: boolean | null
          base_price?: number | null
          business_name?: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          external_website?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_reviews_count?: number | null
          id?: string
          image_url?: string | null
          insurance_verified?: boolean | null
          latitude?: number | null
          license_number?: string | null
          location?: string
          longitude?: number | null
          phone?: string | null
          pricing_model?: string | null
          specialties?: string[] | null
          updated_at?: string
          user_id?: string | null
          verification_status?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      search_cache: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          location: string
          original_query: string
          query_hash: string
          results: Json
          search_analysis: Json | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          location: string
          original_query: string
          query_hash: string
          results: Json
          search_analysis?: Json | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          location?: string
          original_query?: string
          query_hash?: string
          results?: Json
          search_analysis?: Json | null
        }
        Relationships: []
      }
      social_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          group_type: string
          id: string
          location: string | null
          name: string
          neighborhood: string | null
          privacy_level: string
          school_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          group_type: string
          id?: string
          location?: string | null
          name: string
          neighborhood?: string | null
          privacy_level?: string
          school_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          group_type?: string
          id?: string
          location?: string | null
          name?: string
          neighborhood?: string | null
          privacy_level?: string
          school_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_expired_search_cache: { Args: never; Returns: undefined }
      get_current_user_type: { Args: never; Returns: string }
      get_public_provider_info: {
        Args: never
        Returns: {
          age_groups: string[]
          amenities: string[]
          base_price: number
          business_name: string
          capacity: number
          created_at: string
          description: string
          external_website: string
          google_rating: number
          google_reviews_count: number
          id: string
          location: string
          phone: string
          pricing_model: string
          specialties: string[]
          updated_at: string
          user_id: string
          verification_status: string
          years_experience: number
        }[]
      }
    }
    Enums: {
      user_type: "parent" | "provider"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_type: ["parent", "provider"],
    },
  },
} as const
