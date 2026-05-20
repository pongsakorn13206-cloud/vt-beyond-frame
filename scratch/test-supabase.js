const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] ? match[2].trim() : '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRole = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
  console.error('Missing Supabase environment variables in .env.local!');
  console.log('Parsed env:', env);
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function runDiagnostics() {
  console.log('--- Supabase Connection Diagnostics ---');
  console.log('Supabase URL:', supabaseUrl);
  
  // 1. Test database connection
  try {
    const { data: events, error: dbError } = await supabaseAdmin
      .from('events')
      .select('*')
      .limit(1);
      
    if (dbError) {
      console.error('❌ Database connection failed:', dbError.message);
    } else {
      console.log('✅ Database connection successful! Found events count:', events.length);
    }
  } catch (err) {
    console.error('❌ Database exception:', err.message);
  }

  // 2. Test storage bucket access
  try {
    const { data: buckets, error: storageError } = await supabaseAdmin
      .storage
      .listBuckets();
      
    if (storageError) {
      console.error('❌ Storage access failed:', storageError.message);
    } else {
      console.log('✅ Storage connection successful! Available buckets:');
      buckets.forEach(b => console.log(`  - Bucket: "${b.name}" (Public: ${b.public})`));
      
      const hasEventPhotos = buckets.some(b => b.name === 'event-photos');
      if (hasEventPhotos) {
        console.log('  ✅ Found required "event-photos" bucket!');
      } else {
        console.error('  ❌ MISSING required "event-photos" bucket! Please create it in Supabase Console.');
      }
    }
  } catch (err) {
    console.error('❌ Storage exception:', err.message);
  }

  // 3. Test uploading a dummy file
  try {
    const dummyBuffer = Buffer.from('hello world');
    const fileName = `test-diagnostics-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('event-photos')
      .upload(fileName, dummyBuffer, {
        contentType: 'text/plain',
        upsert: true
      });
      
    if (uploadError) {
      console.error('❌ Storage upload failed:', uploadError.message, uploadError);
    } else {
      console.log('✅ Dummy file upload successful! Path:', uploadData.path);
      
      // Clean it up
      const { error: deleteError } = await supabaseAdmin
        .storage
        .from('event-photos')
        .remove([fileName]);
        
      if (deleteError) {
        console.error('  ⚠️ Failed to delete test dummy file:', deleteError.message);
      } else {
        console.log('  ✅ Cleaned up dummy file successfully.');
      }
    }
  } catch (err) {
    console.error('❌ Storage upload exception:', err.message);
  }
}

runDiagnostics();
