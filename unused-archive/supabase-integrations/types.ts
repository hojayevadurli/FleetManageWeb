export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      billing_subscriptions: {
        Row: {
          billing_cycle: string | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_name: string
          plan_price: number | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string
          plan_price?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_name?: string
          plan_price?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      drivers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          license_expiry: string | null
          license_number: string | null
          license_state: string | null
          motive_driver_id: string
          name: string
          phone: string | null
          role: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          license_state?: string | null
          motive_driver_id: string
          name: string
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          license_state?: string | null
          motive_driver_id?: string
          name?: string
          phone?: string | null
          role?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inspection_results: {
        Row: {
          created_at: string
          id: string
          inspection_id: string
          item_category: string
          item_name: string
          notes: string | null
          photos: string[] | null
          result: string
          videos: string[] | null
        }
        Insert: {
          created_at?: string
          id?: string
          inspection_id: string
          item_category: string
          item_name: string
          notes?: string | null
          photos?: string[] | null
          result: string
          videos?: string[] | null
        }
        Update: {
          created_at?: string
          id?: string
          inspection_id?: string
          item_category?: string
          item_name?: string
          notes?: string | null
          photos?: string[] | null
          result?: string
          videos?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_results_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_templates: {
        Row: {
          created_at: string
          description: string | null
          fields: Json
          id: string
          is_default: boolean
          is_pti: boolean
          name: string
          updated_at: string
          user_id: string
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          is_default?: boolean
          is_pti?: boolean
          name: string
          updated_at?: string
          user_id: string
          vehicle_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          is_default?: boolean
          is_pti?: boolean
          name?: string
          updated_at?: string
          user_id?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      inspections: {
        Row: {
          completed_at: string | null
          created_at: string
          driver_id: string | null
          id: string
          inspection_date: string
          inspection_name: string
          location: Json | null
          notes: string | null
          overall_result: string | null
          signature_url: string | null
          status: string
          template_id: string | null
          updated_at: string
          user_id: string
          vehicle_id: string
          vehicle_type: string
          work_order_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          inspection_date: string
          inspection_name: string
          location?: Json | null
          notes?: string | null
          overall_result?: string | null
          signature_url?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
          vehicle_id: string
          vehicle_type: string
          work_order_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          inspection_date?: string
          inspection_name?: string
          location?: Json | null
          notes?: string | null
          overall_result?: string | null
          signature_url?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
          vehicle_id?: string
          vehicle_type?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "inspection_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspections_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          invoice_url: string | null
          payment_date: string | null
          payment_method: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_url?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_url?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      service_history: {
        Row: {
          created_at: string
          id: string
          invoice_url: string | null
          labor_hours: number | null
          mileage: number | null
          service_date: string
          shop_id: string | null
          total_cost: number | null
          updated_at: string
          vehicle_id: string
          vehicle_type: string
          work_completed: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_url?: string | null
          labor_hours?: number | null
          mileage?: number | null
          service_date: string
          shop_id?: string | null
          total_cost?: number | null
          updated_at?: string
          vehicle_id: string
          vehicle_type: string
          work_completed: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_url?: string | null
          labor_hours?: number | null
          mileage?: number | null
          service_date?: string
          shop_id?: string | null
          total_cost?: number | null
          updated_at?: string
          vehicle_id?: string
          vehicle_type?: string
          work_completed?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_history_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_ratings: {
        Row: {
          created_at: string
          id: string
          rating: number
          review_text: string | null
          service_date: string | null
          shop_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          service_date?: string | null
          shop_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          service_date?: string | null
          shop_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_ratings_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_services: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean | null
          service_category: string
          service_name: string
          shop_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          service_category: string
          service_name: string
          shop_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean | null
          service_category?: string
          service_name?: string
          shop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_services_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          address: string
          average_rating: number | null
          comment: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          hours_of_operation: Json | null
          id: string
          image_url: string | null
          labor_rate: number
          latitude: number | null
          longitude: number | null
          phone: string | null
          rate_category: string | null
          shop_id: string
          shop_name: string
          specialties: Json | null
          total_reviews: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address: string
          average_rating?: number | null
          comment?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          hours_of_operation?: Json | null
          id?: string
          image_url?: string | null
          labor_rate: number
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          rate_category?: string | null
          shop_id: string
          shop_name: string
          specialties?: Json | null
          total_reviews?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string
          average_rating?: number | null
          comment?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          hours_of_operation?: Json | null
          id?: string
          image_url?: string | null
          labor_rate?: number
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          rate_category?: string | null
          shop_id?: string
          shop_name?: string
          specialties?: Json | null
          total_reviews?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          records_failed: number | null
          records_processed: number | null
          records_successful: number | null
          started_at: string
          status: string
          sync_details: Json | null
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_failed?: number | null
          records_processed?: number | null
          records_successful?: number | null
          started_at?: string
          status?: string
          sync_details?: Json | null
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_failed?: number | null
          records_processed?: number | null
          records_successful?: number | null
          started_at?: string
          status?: string
          sync_details?: Json | null
          sync_type?: string
        }
        Relationships: []
      }
      trailers: {
        Row: {
          created_at: string
          id: string
          make: string
          status: string
          updated_at: string
          vehicle_id: string
          vin: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          make: string
          status?: string
          updated_at?: string
          vehicle_id: string
          vin: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          make?: string
          status?: string
          updated_at?: string
          vehicle_id?: string
          vin?: string
          year?: number
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          created_at: string | null
          feature_name: string
          id: string
          period_end: string | null
          period_start: string | null
          subscription_id: string | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          feature_name: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          feature_name?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_tracking_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          created_at: string
          current_location: Json | null
          driver_assigned: string | null
          engine_hours: number | null
          external_id: string | null
          fuel_level: number | null
          fuel_type: string | null
          id: string
          last_location_update: string | null
          last_sync_at: string | null
          license_plate: string | null
          make: string
          model: string
          motive_vehicle_id: string | null
          odometer_reading: number | null
          status: string
          status_details: string | null
          sync_status: string | null
          updated_at: string
          vehicle_id: string
          vehicle_type: string | null
          vin: string
          year: number
        }
        Insert: {
          created_at?: string
          current_location?: Json | null
          driver_assigned?: string | null
          engine_hours?: number | null
          external_id?: string | null
          fuel_level?: number | null
          fuel_type?: string | null
          id?: string
          last_location_update?: string | null
          last_sync_at?: string | null
          license_plate?: string | null
          make: string
          model: string
          motive_vehicle_id?: string | null
          odometer_reading?: number | null
          status?: string
          status_details?: string | null
          sync_status?: string | null
          updated_at?: string
          vehicle_id: string
          vehicle_type?: string | null
          vin: string
          year: number
        }
        Update: {
          created_at?: string
          current_location?: Json | null
          driver_assigned?: string | null
          engine_hours?: number | null
          external_id?: string | null
          fuel_level?: number | null
          fuel_type?: string | null
          id?: string
          last_location_update?: string | null
          last_sync_at?: string | null
          license_plate?: string | null
          make?: string
          model?: string
          motive_vehicle_id?: string | null
          odometer_reading?: number | null
          status?: string
          status_details?: string | null
          sync_status?: string | null
          updated_at?: string
          vehicle_id?: string
          vehicle_type?: string | null
          vin?: string
          year?: number
        }
        Relationships: []
      }
      work_order_templates: {
        Row: {
          created_at: string
          default_items: Json | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_items?: Json | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_items?: Json | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      work_orders: {
        Row: {
          actual_cost: number | null
          actual_hours: number | null
          assigned_to: string | null
          attachments: Json | null
          company_name: string | null
          completed_date: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_cost: number | null
          estimated_hours: number | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
          vehicle_id: string
          vehicle_type: string
          work_order_number: string
        }
        Insert: {
          actual_cost?: number | null
          actual_hours?: number | null
          assigned_to?: string | null
          attachments?: Json | null
          company_name?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          vehicle_id: string
          vehicle_type?: string
          work_order_number: string
        }
        Update: {
          actual_cost?: number | null
          actual_hours?: number | null
          assigned_to?: string | null
          attachments?: Json | null
          company_name?: string | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          vehicle_id?: string
          vehicle_type?: string
          work_order_number?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_shop_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_work_order_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
