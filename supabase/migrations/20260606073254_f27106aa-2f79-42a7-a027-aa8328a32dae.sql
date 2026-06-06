
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_user_profile_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
