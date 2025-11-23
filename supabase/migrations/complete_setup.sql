/*
  # Complete HOA Management System Setup Script
  
  This script should be run ONCE before starting the application.
  It will:
  1. Create profiles for existing auth users
  2. Set up automatic profile creation trigger
  3. Fix RLS policies to prevent infinite recursion
  4. Verify everything is working correctly
  
  Run this in Supabase SQL Editor before starting your application.
*/

-- =====================================================
-- PART 1: Create profiles for existing auth users
-- =====================================================

-- Create admin profile for admin@hoa.com
INSERT INTO profiles (id, email, full_name, role, phone)
SELECT 
  id,
  email,
  'Admin User' as full_name,
  'admin' as role,
  NULL as phone
FROM auth.users 
WHERE email = 'admin@hoa.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  full_name = COALESCE(profiles.full_name, 'Admin User'),
  updated_at = now();

-- Create resident profile for resident@hoa.com (if exists)
INSERT INTO profiles (id, email, full_name, role, phone)
SELECT 
  id,
  email,
  'Resident User' as full_name,
  'resident' as role,
  NULL as phone
FROM auth.users 
WHERE email = 'resident@hoa.com'
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'resident',
  full_name = COALESCE(profiles.full_name, 'Resident User'),
  updated_at = now();

-- Create profiles for any other existing users (default to resident role)
INSERT INTO profiles (id, email, full_name, role)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
  'resident' as role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PART 2: Create trigger for automatic profile creation
-- =====================================================

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'resident')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- PART 3: Fix RLS policies to prevent infinite recursion
-- =====================================================

-- Create a security definer function to safely check admin status
-- This bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- Drop existing SELECT policies on profiles that cause recursion
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Recreate policies using the security definer function
-- Policy 1: Users can always view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Admins can view all profiles (using security definer function)
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- =====================================================
-- PART 4: Verify the setup
-- =====================================================

-- Check all profiles
SELECT 
  '✓ Profiles Created' as status,
  p.email, 
  p.full_name, 
  p.role,
  CASE 
    WHEN p.role = 'admin' THEN '✓ ADMIN ACCESS'
    ELSE 'Resident Access'
  END as access_level
FROM profiles p
ORDER BY p.role DESC, p.created_at DESC;

-- Check if trigger exists
SELECT 
  '✓ Trigger Installed' as status,
  trigger_name, 
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Check if security definer function exists
SELECT 
  '✓ Security Function Created' as status,
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_name = 'is_admin'
  AND routine_schema = 'public';

-- Check RLS policies
SELECT 
  '✓ RLS Policies Fixed' as status,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'SELECT'
ORDER BY policyname;

-- Final summary
SELECT 
  '=== SETUP COMPLETE ===' as message,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM profiles WHERE role = 'admin') as admin_count,
  (SELECT COUNT(*) FROM profiles WHERE role = 'resident') as resident_count;
