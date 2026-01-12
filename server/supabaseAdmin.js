console.log("ADMIN URL:", process.env.SUPABASE_URL);

const { createClient } = require("@supabase/supabase-js");

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL is missing");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = { supabaseAdmin };
