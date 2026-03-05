
-- Fix overly permissive notification insert policy
DROP POLICY "Create notifications" ON public.notifications;
CREATE POLICY "Authenticated create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));
