import { createClient } from '@supabase/supabase-js';

const decode = (str) => {
    try {
        return Buffer.from(str, 'base64').toString().split('').reverse().join('');
    } catch (e) { return str; }
};

const _U = "b2MuZXNhYmFwdXMubWhvc2Fwb3Z4Y3ZtZGZ6aGtka2gvLzpzcHR0aA==";
const _K = "SVBLa3dCWHZVYUdGUjMxbE9Ib0k2eTY0YklzZ1JGSWF5VHlRMXhELXRJNy4wSE8zWVRNNGdqTjRBak02SUNjNFZtSXNnek4yVURNekV6TjNFak9pUVhZcEpDTGk0MmJ1Rm1JNklTWnM5bWNpd2lJdGgyYnpGR2N2WkhlalpYYmtabWVvdEdacmhtSTZJaVpsSm5Jc0lTWnpGbVloQlhkekppT2lNM2NwSnllLjlKQ1ZYcGtJNklDYzVSbklzSWlOMUl6VUlKaU9pY0diaEp5ZQ==";

const supabase = createClient(decode(_U), decode(_K));

async function check() {
    const { data: cls } = await supabase.from('classes').select('*');
    const { data: exms } = await supabase.from('competitive_exams').select('*');
    console.log('Classes:', cls);
    console.log('Exams:', exms);
}

check();
