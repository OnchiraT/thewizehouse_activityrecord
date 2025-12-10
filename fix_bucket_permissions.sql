-- 1. Make the bucket explicitly public
update storage.buckets
set public = true
where id = 'activity-images';

-- 2. Drop existing policies to avoid conflicts
drop policy if exists "Anyone can upload activity images" on storage.objects;
drop policy if exists "Authenticated users can upload activity images" on storage.objects;
drop policy if exists "Anyone can view activity images" on storage.objects;
drop policy if exists "Public Access" on storage.objects;

-- 3. Create a policy for Authenticated Users to Upload
create policy "Authenticated users can upload activity images"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'activity-images' );

-- 4. Create a policy for Public Read Access
create policy "Public Access"
  on storage.objects for select
  to public
  using ( bucket_id = 'activity-images' );

-- 5. (Optional) Allow users to update/delete their own files if needed
create policy "Users can update own images"
  on storage.objects for update
  to authenticated
  using ( auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users can delete own images"
  on storage.objects for delete
  to authenticated
  using ( auth.uid()::text = (storage.foldername(name))[1] );
