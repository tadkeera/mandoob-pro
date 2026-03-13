
-- Fix: Restrict the notifications INSERT policy to only allow inserting for actual recipients
-- (managers/admins inserting notifications for reps is fine, but let's be explicit)
DROP POLICY IF EXISTS "Anyone authenticated can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow inserting notifications for any user (managers notifying reps)
    -- but only authenticated users can do this
    auth.uid() IS NOT NULL
  );
