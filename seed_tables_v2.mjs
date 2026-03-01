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

async function seed() {
    console.log('Seeding database tables...');

    // 1. Classes
    const classes = ['IX', 'X', 'XI', 'XII', 'XII+'];
    const { error: clsErr } = await supabase.from('classes').insert(classes.map(name => ({ name })));
    if (clsErr) console.error('Error inserting classes:', clsErr.message);

    // 2. Streams (PCM, PCB, etc)
    const streams = ['PCM', 'PCB', 'Arts', 'Commerce', 'Science'];
    // PCM and PCB already exist based on check_tables, but let's UPSERT or just insert missing ones
    for (const s of streams) {
        const { data } = await supabase.from('streams').select('id').eq('name', s).maybeSingle();
        if (!data) {
            await supabase.from('streams').insert([{ name: s }]);
        }
    }

    console.log('Done!');
}

seed();
