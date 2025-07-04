export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      deals: {
        Row: {
          id: string
          created_at: string
          business_name: string | null
          asking_price: number | null
          annual_revenue: number | null
          annual_profit: number | null
          description: string | null
          source_url: string | null
          amazon_category: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          business_name: string | null
          asking_price: number | null
          annual_revenue: number | null
          annual_profit: number | null
          description: string | null
          source_url: string | null
          amazon_category: string | null
          user_id: string | null
        }
        Update: {
          id?: string
          created_at?: string
          business_name?: string | null
          asking_price?: number | null
          annual_revenue?: number | null
          annual_profit?: number | null
          description?: string | null
          source_url?: string | null
          amazon_category?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
