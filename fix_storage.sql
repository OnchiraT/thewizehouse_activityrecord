-- Make the bucket public so getPublicUrl works
update storage.buckets
set public = true
where id = 'activity-images';

-- Ensure RLS policies allow public access if needed (though public=true handles most GETs)
-- But we want to ensure authenticated users can upload
-- The existing policies were:
-- create policy "Anyone can upload activity images" on storage.objects for insert with check ( bucket_id = 'activity-images' );
-- create policy "Anyone can view activity images" on storage.objects for select using ( bucket_id = 'activity-images' );

-- We can drop and recreate to be sure, or just rely on the public=true for viewing.
-- For uploading, we need to ensure the policy allows it.

-- Let's make sure the upload policy is correct for authenticated users
drop policy if exists "Anyone can upload activity images" on storage.objects;
create policy "Authenticated users can upload activity images"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'activity-images' );

-- And allow public viewing explicitly via RLS just in case
drop policy if exists "Anyone can view activity images" on storage.objects;
create policy "Anyone can view activity images"
  on storage.objects for select
  to public
  using ( bucket_id = 'activity-images' );
