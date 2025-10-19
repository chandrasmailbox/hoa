import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'resident';
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type Property = {
  id: string;
  unit_number: string;
  address: string;
  owner_id: string | null;
  square_footage: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  created_at: string;
  updated_at: string;
};

export type MaintenanceRequest = {
  id: string;
  title: string;
  description: string | null;
  category: 'landscaping' | 'pool' | 'security' | 'repairs' | 'utilities' | 'cleaning' | 'other';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_vendor: string | null;
  requested_by: string | null;
  property_id: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  scheduled_date: string | null;
  completed_date: string | null;
  is_recurring: boolean;
  recurrence_interval: 'monthly' | 'quarterly' | 'annually' | null;
  created_at: string;
  updated_at: string;
};

export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  property_id: string | null;
  maintenance_request_id: string | null;
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'online' | null;
  reference_number: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Payment = {
  id: string;
  property_id: string;
  amount: number;
  payment_type: 'monthly_dues' | 'special_assessment' | 'fine' | 'other';
  payment_date: string | null;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method: 'cash' | 'check' | 'credit_card' | 'bank_transfer' | 'online' | null;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
  published_by: string | null;
  published_at: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'payment_reminder' | 'maintenance_update' | 'announcement' | 'system';
  is_read: boolean;
  related_id: string | null;
  created_at: string;
};
