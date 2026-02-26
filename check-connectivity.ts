/**
 * Connectivity Smoke Test
 * 
 * This script tests the live Render API against the known origins (Vercel demo and WordPress site)
 * to ensure that CORS is correctly configured and the API is reachable.
 * 
 * Usage: npx ts-node check-connectivity.ts <API_URL> <VERCEL_URL> <WP_URL>
 */

const args = process.argv.slice(2);

if (args.length < 3) {
    console.error('Usage: npx ts-node check-connectivity.ts <API_URL> <VERCEL_URL> <WP_URL>');
    console.error('Example: npx ts-node check-connectivity.ts https://gymbot-api.onrender.com/api https://fitbot-demo.vercel.app https://gym.wordpress.com');
    process.exit(1);
}

const [apiUrl, vercelUrl, wpUrl] = args;
const healthEndpoint = `${apiUrl}/health`;

async function testOrigin(origin: string) {
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

        // Let's check the actual health endpoint as well
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
    } catch (e: any) {
        console.error(`❌ Connection error testing ${origin}: ${e.message}`);
    }
}

async function run() {
    console.log(`Starting Connectivity Smoke Test for API: ${apiUrl}`);
    await testOrigin(vercelUrl);
    await testOrigin(wpUrl);
}

run();
