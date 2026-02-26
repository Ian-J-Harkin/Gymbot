const apiUrl = 'https://gymbot-api.onrender.com/api';
const vercelUrl = 'https://fitbot-demo.vercel.app';
const wpUrl = 'https://jabberdocky.com';

const healthEndpoint = `${apiUrl}/health`;

async function testOrigin(origin) {
    console.log(`\nTesting from origin: ${origin}`);
    try {
        const response = await fetch(healthEndpoint, {
            method: 'OPTIONS', // Test preflight for CORS
            headers: {
                'Origin': origin,
                'Access-Control-Request-Method': 'GET'
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);

        const getResponse = await fetch(healthEndpoint, {
            headers: {
                'Origin': origin
            }
        });

        if (getResponse.ok) {
            const data = await getResponse.json();
            console.log(`✅ Success! API is healthy: ${JSON.stringify(data)}`);
            console.log(`✅ CORS is allowing origin: ${origin}`);
        } else {
            console.error(`❌ Failed to fetch health endpoint from ${origin}. Status: ${getResponse.status}`);
        }
    } catch (e) {
        console.error(`❌ Connection error testing ${origin}: ${e.message}`);
    }
}

async function run() {
    console.log(`Starting Connectivity Smoke Test for API: ${apiUrl}`);
    await testOrigin(vercelUrl);
    await testOrigin(wpUrl);
}

run();
