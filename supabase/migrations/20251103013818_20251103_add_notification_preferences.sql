/*
  # Add Notification Preferences Table

  1. New Tables
    - `notification_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `payment_reminders` (boolean)
      - `maintenance_updates` (boolean)
      - `announcements` (boolean)
      - `system_notifications` (boolean)
      - `email_notifications` (boolean)
      - `push_notifications` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `notification_preferences` table
    - Add policy for users to manage their own preferences
*/

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_reminders boolean DEFAULT true,
  maintenance_updates boolean DEFAULT true,
  announcements boolean DEFAULT true,
  system_notifications boolean DEFAULT true,
  email_notifications boolean DEFAULT false,
  push_notifications boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own preferences
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own preferences
CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to insert their own preferences
CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically create notification preferences for new users
CREATE OR REPLACE FUNCTION create_user_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create preferences
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_notification_preferences();
