
import { createClient } from '@supabase/supabase-js';

// Updated with the correct Project URL
const SUPABASE_URL = 'https://gfvebzsysaskgyhplrvd.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmdmVienN5c2Fza2d5aHBscnZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjk3MjcsImV4cCI6MjA4MDYwNTcyN30.UOhulRCr7qhBkGGem4Fu-0ku70wXqnILHPLVwRoI_5A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
