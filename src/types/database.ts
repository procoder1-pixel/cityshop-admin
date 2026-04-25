export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          role: 'agent' | 'promoter' | 'admin'
          is_admin: boolean
          is_suspended: boolean
          subscription_active: boolean
          subscription_end: string | null
          paystack_ref: string
          avatar_url: string
          profile_banner_url: string
          created_at: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      stores: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          description: string
          logo_url: string
          banner_url: string
          phone: string
          whatsapp: string
          is_active: boolean
          is_verified: boolean
          created_at: string
        }
        Update: Partial<Database['public']['Tables']['stores']['Row']>
      }
      products: {
        Row: {
          id: string
          store_id: string
          name: string
          description: string
          price: number
          wholesale_price: number | null
          image_url: string
          category: string
          in_stock: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['products']['Row']>
      }
      withdrawals: {
        Row: {
          id: string
          user_id: string
          role: 'agent' | 'promoter'
          full_name: string
          email: string
          network: 'MTN' | 'Telecel' | 'AirtelTigo'
          momo_number: string
          amount: number
          status: 'pending' | 'approved' | 'rejected'
          note: string
          created_at: string
          updated_at: string
        }
        Update: Partial<Database['public']['Tables']['withdrawals']['Row']>
      }
      announcements: {
        Row: {
          id: string
          message: string
          type: 'info' | 'warning' | 'success' | 'error'
          target_role: 'all' | 'agents' | 'promoters'
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['announcements']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['announcements']['Row']>
      }
      audit_logs: {
        Row: {
          id: string
          admin_id: string | null
          action: string
          target_user_id: string | null
          detail: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
      }
    }
  }
}

export type Profile      = Database['public']['Tables']['profiles']['Row']
export type Store        = Database['public']['Tables']['stores']['Row']
export type Product      = Database['public']['Tables']['products']['Row']
export type Withdrawal   = Database['public']['Tables']['withdrawals']['Row']
export type Announcement = Database['public']['Tables']['announcements']['Row']
export type AuditLog     = Database['public']['Tables']['audit_logs']['Row']
