import { createClient } from '@supabase/supabase-js';

const decode = (str) => {
    try {
        // Standard atob equivalent in Node
        let b = Buffer.from(str, 'base64').toString('binary');
        // Reverse
        let r = b.split('').reverse().join('');
        return r;
    } catch (e) { return str; }
};

const _U = "b2MuZXNhYmFwdXMubWhvc2Fwb3Z4Y3ZtZGZ6aGtka2gvLzpzcHR0aA==";
const _K = "SVBLa3dCWHZVYUdGUjMxbE9Ib0k2eTY0YklzZ1JGSWF5VHlRMXhELXRJNy4wSE8zWVRNNGdqTjRBak02SUNjNFZtSXNnek4yVURNekV6TjNFak9pUVhZcEpDTGk0MmJ1Rm1JNklTWnM5bWNpd2lJdGgyYnpGR2N2WkhlalpYYmtabWVvdEdacmhtSTZJaVpsSm5Jc0lTWnpGbVloQlhkekppT2lNM2NwSnllLjlKQ1ZYcGtJNklDYzVSbklzSWlOMUl6VUlKaU9pY0diaEp5ZQ==";

const url = decode(_U);
console.log('Decoded URL:', url);
const supabase = createClient(url, decode(_K));

async function check() {
    const { data: settings, error } = await supabase.from('settings').select('*').limit(1);
    console.log('Settings Data:', settings);
    if (error) console.error('Error:', error);
}

check();
