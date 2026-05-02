const { createClient } = require('@supabase/supabase-js');

const url = "https://bkugqqsjnrcrxgomjvda.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrdWdxcXNqbnJjcnhnb21qdmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2OTMwMjYsImV4cCI6MjA5MzI2OTAyNn0.RRr0wnr6qCa2PdlqwezYWvx7eopldxP46-x6DCJypQU";

const supabase = createClient(url, key);

(async () => {
  const { data, error } = await supabase.from('resources').select('*');
  if (error) {
    console.error("Supabase Error:", error);
  } else {
    console.log("SUCCESS! Row count in database:", data.length);
    console.log("Rows data:", data);
  }
})();
