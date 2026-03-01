import { createClient } from '@supabase/supabase-js';

const decode = (str) => {
    try {
        let b = Buffer.from(str, 'base64').toString('binary');
        let r = b.split('').reverse().join('');
        return r;
    } catch (e) { return str; }
};

const _U = "b2MuZXNhYmFwdXMubWhvc2Fwb3Z4Y3ZtZGZ6aGtka2gvLzpzcHR0aA==";
const _K = "SVBLa3dCWHZVYUdGUjMxbE9Ib0k2eTY0YklzZ1JGSWF5VHlRMXhELXRJNy4wSE8zWVRNNGdqTjRBak02SUNjNFZtSXNnek4yVURNekV6TjNFak9pUVhZcEpDTGk0MmJ1Rm1JNklTWnM5bWNpd2lJdGgyYnpGR2N2WkhlalpYYmtabWVvdEdacmhtSTZJaVpsSm5Jc0lTWnpGbVloQlhkekppT2lNM2NwSnllLjlKQ1ZYcGtJNklDYzVSbklzSWlOMUl6VUlKaU9pY0diaEp5ZQ==";

const url = decode(_U);
const key = decode(_K);
const supabase = createClient(url, key);

async function checkClasses() {
    const { data, error } = await supabase.from('classes').select('*');
    if (error) {
        console.error('Error fetching classes:', error);
    } else {
        console.log('Classes in DB:', data);
    }

    const { data: streams, error: sError } = await supabase.from('streams').select('*');
    console.log('Streams in DB:', streams);
}

checkClasses();
