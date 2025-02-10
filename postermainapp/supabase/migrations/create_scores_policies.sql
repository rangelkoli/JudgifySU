-- Enable RLS
alter table scores enable row level security;

-- Create policy for inserting scores
create policy "Users can insert their own scores"
on scores for insert
with check (auth.uid() = user_id);

-- Create policy for updating scores
create policy "Users can update their own scores"
on scores for update
using (auth.uid() = user_id);

-- Create policy for viewing scores
create policy "Anyone can view scores"
on scores for select
using (true);
