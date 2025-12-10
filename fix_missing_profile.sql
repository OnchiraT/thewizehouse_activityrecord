-- Fix missing profile for olyntarget@gmail.com

insert into public.profiles (id, nickname, full_name, upline, points, streak)
select 
  id, 
  raw_user_meta_data ->> 'nickname', 
  raw_user_meta_data ->> 'full_name', 
  raw_user_meta_data ->> 'upline', 
  0, 
  0
from auth.users
where email = 'olyntarget@gmail.com'
and not exists (
  select 1 from public.profiles where id = auth.users.id
);
