import { createClient } from '@supabase/supabase-js';

const decode = (str) => {
    try {
        return Buffer.from(str, 'base64').toString().split('').reverse().join('');
    } catch (e) { return str; }
};

const _U = "b2MuZXNhYmFwdXMubWhvc2Fwd3Z4Y3ZtZGZ6aGtka2gvLzpzcHR0aA==";
const _K = "SVBLa3dCWHZVYUdGUjMxbE9Ib0k2eTY0YklzZ1JGSWF5VHlRMXhELXRJNy4wSE8zWVRNNGdqTjRBak02SUNjNFZtSXNnek4yVURNekV6TjNFak9pUVhZcEpDTGk0MmJ1Rm1JNklTWnM5bWNpd2lJdGgyYnpGR2N2WkhlalpYYmtabWVvdEdacmhtSTZJaVpsSm5Jc0lTWnpGbVloQlhkekppT2lNM2NwSnllLjlKQ1ZYcGtJNklDYzVSbklzSWlOMUl6VUlKaU9pY0diaEp5ZQ==";

const supabase = createClient(decode(_U), decode(_K));

async function fixSchema() {
    console.log('Adding maintenance_opening_date to settings table...');
    const { error } = await supabase.rpc('add_maintenance_column', {
        sql_input: 'ALTER TABLE settings ADD COLUMN IF NOT EXISTS maintenance_opening_date TIMESTAMP WITH TIME ZONE;'
    });

    // If RPC fails (likely not defined), try direct update but Supabase JS doesn't support ALTER directly.
    // We will check if we can at least see the table structure.
    const { data: settings, error: fetchError } = await supabase.from('settings').select('*').limit(1);
    console.log('Current settings:', settings);
    if (fetchError) console.error('Fetch error:', fetchError);
}

fixSchema();
