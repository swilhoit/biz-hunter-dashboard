
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          analysis_data: Json
          analysis_type: string
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          id: string
          listing_id: string | null
          model_used: string | null
        }
        Insert: {
          analysis_data: Json
          analysis_type: string
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          id?: string
          listing_id?: string | null
          model_used?: string | null
        }
        Update: {
          analysis_data?: Json
          analysis_type?: string
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          id?: string
          listing_id?: string | null
          model_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_analyses_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      asins: {
        Row: {
          asin: string
          brand: string | null
          category: string | null
          created_at: string | null
          current_bsr: number | null
          current_price: number | null
          id: string
          last_updated: string | null
          main_image_url: string | null
          review_count: number | null
          review_rating: number | null
          subcategory: string | null
          title: string | null
        }
        Insert: {
          asin: string
          brand?: string | null
          category?: string | null
          created_at?: string | null
          current_bsr?: number | null
          current_price?: number | null
          id?: string
          last_updated?: string | null
          main_image_url?: string | null
          review_count?: number | null
          review_rating?: number | null
          subcategory?: string | null
          title?: string | null
        }
        Update: {
          asin?: string
          brand?: string | null
          category?: string | null
          created_at?: string | null
          current_bsr?: number | null
          current_price?: number | null
          id?: string
          last_updated?: string | null
          main_image_url?: string | null
          review_count?: number | null
          review_rating?: number | null
          subcategory?: string | null
          title?: string | null
        }
        Relationships: []
      }
      business_listings: {
        Row: {
          annual_profit: number | null
          annual_revenue: number | null
          asking_price: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          duplicate_count: number | null
          duplicate_group_id: string | null
          gross_revenue: number | null
          highlights: string[] | null
          id: string
          image_url: string | null
          industry: string | null
          inventory_value: number | null
          is_active: boolean | null
          is_primary_listing: boolean | null
          last_verified_at: string | null
          listing_status: string | null
          location: string | null
          monthly_revenue: number | null
          name: string
          net_revenue: number | null
          normalized_name: string | null
          original_url: string | null
          profit_multiple: number | null
          scraped_at: string | null
          similarity_score: number | null
          source: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          updated_at: string | null
          verification_status: string | null
        }
        Insert: {
          annual_profit?: number | null
          annual_revenue?: number | null
          asking_price?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duplicate_count?: number | null
          duplicate_group_id?: string | null
          gross_revenue?: number | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          industry?: string | null
          inventory_value?: number | null
          is_active?: boolean | null
          is_primary_listing?: boolean | null
          last_verified_at?: string | null
          listing_status?: string | null
          location?: string | null
          monthly_revenue?: number | null
          name: string
          net_revenue?: number | null
          normalized_name?: string | null
          original_url?: string | null
          profit_multiple?: number | null
          scraped_at?: string | null
          similarity_score?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Update: {
          annual_profit?: number | null
          annual_revenue?: number | null
          asking_price?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          duplicate_count?: number | null
          duplicate_group_id?: string | null
          gross_revenue?: number | null
          highlights?: string[] | null
          id?: string
          image_url?: string | null
          industry?: string | null
          inventory_value?: number | null
          is_active?: boolean | null
          is_primary_listing?: boolean | null
          last_verified_at?: string | null
          listing_status?: string | null
          location?: string | null
          monthly_revenue?: number | null
          name?: string
          net_revenue?: number | null
          normalized_name?: string | null
          original_url?: string | null
          profit_multiple?: number | null
          scraped_at?: string | null
          similarity_score?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          updated_at?: string | null
          verification_status?: string | null
        }
        Relationships: []
      }
      deal_activities: {
        Row: {
          created_at: string | null
          deal_id: string
          description: string | null
          id: string
          outcome: string | null
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          description?: string | null
          id?: string
          outcome?: string | null
          title: string
          type: Database["public"]["Enums"]["activity_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          description?: string | null
          id?: string
          outcome?: string | null
          title?: string
          type?: Database["public"]["Enums"]["activity_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_asins: {
        Row: {
          added_at: string | null
          asin_id: string
          deal_id: string
          id: string
          is_primary: boolean | null
          notes: string | null
        }
        Insert: {
          added_at?: string | null
          asin_id: string
          deal_id: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
        }
        Update: {
          added_at?: string | null
          asin_id?: string
          deal_id?: string
          id?: string
          is_primary?: boolean | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_asins_asin_id_fkey"
            columns: ["asin_id"]
            isOneToOne: false
            referencedRelation: "asins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_asins_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_documents: {
        Row: {
          deal_id: string
          description: string | null
          document_type: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          uploaded_at: string | null
          uploaded_by: string
        }
        Insert: {
          deal_id: string
          description?: string | null
          document_type?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_at?: string | null
          uploaded_by: string
        }
        Update: {
          deal_id?: string
          description?: string | null
          document_type?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          deal_id: string
          description: string | null
          due_date: string | null
          id: string
          priority: Database["public"]["Enums"]["priority_level"] | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          deal_id: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          deal_id?: string
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["priority_level"] | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          actual_close_date: string | null
          amazon_category: string | null
          amazon_store_name: string | null
          amazon_store_url: string | null
          amazon_subcategory: string | null
          annual_profit: number | null
          annual_revenue: number | null
          asking_price: number | null
          business_age: number | null
          business_description: string | null
          business_name: string
          created_at: string | null
          date_listed: string | null
          dba_names: string[] | null
          due_diligence_start_date: string | null
          ebitda: number | null
          employee_count: number | null
          entity_type: string | null
          expected_close_date: string | null
          fba_percentage: number | null
          first_contact_date: string | null
          id: string
          inventory_value: number | null
          is_on_market: boolean | null
          list_price: number | null
          listing_id: string | null
          loi_submitted_date: string | null
          multiple: number | null
          priority: Database["public"]["Enums"]["priority_level"] | null
          sde: number | null
          seller_account_health: string | null
          seller_email: string | null
          seller_location: string | null
          seller_name: string | null
          seller_phone: string | null
          stage: Database["public"]["Enums"]["deal_stage"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          actual_close_date?: string | null
          amazon_category?: string | null
          amazon_store_name?: string | null
          amazon_store_url?: string | null
          amazon_subcategory?: string | null
          annual_profit?: number | null
          annual_revenue?: number | null
          asking_price?: number | null
          business_age?: number | null
          business_description?: string | null
          business_name: string
          created_at?: string | null
          date_listed?: string | null
          dba_names?: string[] | null
          due_diligence_start_date?: string | null
          ebitda?: number | null
          employee_count?: number | null
          entity_type?: string | null
          expected_close_date?: string | null
          fba_percentage?: number | null
          first_contact_date?: string | null
          id?: string
          inventory_value?: number | null
          is_on_market?: boolean | null
          list_price?: number | null
          listing_id?: string | null
          loi_submitted_date?: string | null
          multiple?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          sde?: number | null
          seller_account_health?: string | null
          seller_email?: string | null
          seller_location?: string | null
          seller_name?: string | null
          seller_phone?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          actual_close_date?: string | null
          amazon_category?: string | null
          amazon_store_name?: string | null
          amazon_store_url?: string | null
          amazon_subcategory?: string | null
          annual_profit?: number | null
          annual_revenue?: number | null
          asking_price?: number | null
          business_age?: number | null
          business_description?: string | null
          business_name?: string
          created_at?: string | null
          date_listed?: string | null
          dba_names?: string[] | null
          due_diligence_start_date?: string | null
          ebitda?: number | null
          employee_count?: number | null
          entity_type?: string | null
          expected_close_date?: string | null
          fba_percentage?: number | null
          first_contact_date?: string | null
          id?: string
          inventory_value?: number | null
          is_on_market?: boolean | null
          list_price?: number | null
          listing_id?: string | null
          loi_submitted_date?: string | null
          multiple?: number | null
          priority?: Database["public"]["Enums"]["priority_level"] | null
          sde?: number | null
          seller_account_health?: string | null
          seller_email?: string | null
          seller_location?: string | null
          seller_name?: string | null
          seller_phone?: string | null
          stage?: Database["public"]["Enums"]["deal_stage"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          contact_email: string
          contact_phone: string | null
          created_at: string | null
          id: string
          listing_id: string
          message: string
          status: string | null
          user_id: string
        }
        Insert: {
          contact_email: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          listing_id: string
          message: string
          status?: string | null
          user_id: string
        }
        Update: {
          contact_email?: string
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          listing_id?: string
          message?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      market_data_cache: {
        Row: {
          created_at: string | null
          data_key: string
          data_type: string
          data_value: Json
          expires_at: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          data_key: string
          data_type: string
          data_value: Json
          expires_at?: string | null
          id?: string
        }
        Update: {
          created_at?: string | null
          data_key?: string
          data_type?: string
          data_value?: Json
          expires_at?: string | null
          id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_listings: {
        Row: {
          id: string
          listing_id: string
          notes: string | null
          saved_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          listing_id: string
          notes?: string | null
          saved_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          listing_id?: string
          notes?: string | null
          saved_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      scraped_pages: {
        Row: {
          html_content: string
          id: string
          last_used: string | null
          listings_extracted: number | null
          scraped_at: string | null
          status: string | null
          url: string
        }
        Insert: {
          html_content: string
          id?: string
          last_used?: string | null
          listings_extracted?: number | null
          scraped_at?: string | null
          status?: string | null
          url: string
        }
        Update: {
          html_content?: string
          id?: string
          last_used?: string | null
          listings_extracted?: number | null
          scraped_at?: string | null
          status?: string | null
          url?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      business_listing_duplicates: {
        Row: {
          duplicate_count: number | null
          duplicate_group_id: string | null
          earliest_created: string | null
          latest_created: string | null
          listing_ids: string[] | null
          listing_names: string[] | null
          sources: string[] | null
        }
        Relationships: []
      }
    }
    Functions: {
      normalize_business_name: {
        Args: { name: string }
        Returns: string
      }
    }
    Enums: {
      activity_type:
        | "email"
        | "call"
        | "meeting"
        | "note"
        | "stage_change"
        | "document_upload"
        | "task"
      app_role: "admin" | "user" | "broker"
      deal_stage:
        | "prospecting"
        | "initial_contact"
        | "qualification"
        | "needs_analysis"
        | "value_proposition"
        | "negotiation"
        | "due_diligence"
        | "closing"
        | "closed_won"
        | "closed_lost"
      listing_status: "active" | "pending" | "sold" | "withdrawn"
      listing_status_type:
        | "live"
        | "under_offer"
        | "sold"
        | "offline"
        | "pending"
      priority_level: "low" | "medium" | "high" | "urgent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_type: [
        "email",
        "call",
        "meeting",
        "note",
        "stage_change",
        "document_upload",
        "task",
      ],
      app_role: ["admin", "user", "broker"],
      deal_stage: [
        "prospecting",
        "initial_contact",
        "qualification",
        "needs_analysis",
        "value_proposition",
        "negotiation",
        "due_diligence",
        "closing",
        "closed_won",
        "closed_lost",
      ],
      listing_status: ["active", "pending", "sold", "withdrawn"],
      listing_status_type: [
        "live",
        "under_offer",
        "sold",
        "offline",
        "pending",
      ],
      priority_level: ["low", "medium", "high", "urgent"],
    },
  },
} as const
