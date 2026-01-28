import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jhbogubzkfxbpcsxplzv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoYm9ndWJ6a2Z4YnBjc3hwbHp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzY1MjMsImV4cCI6MjA4NDQ1MjUyM30.NFTw8BBG9jHe3eeO4zMvgHn3PPluvGySrjvViE_OeR8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
