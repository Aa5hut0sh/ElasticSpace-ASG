// agent.js (running on the EC2 instance)
const axios = require('axios');
const { execSync } = require('child_process');

const ORCHESTRATOR_URL = 'http://MAIN_NODE_IP:3000';

async function getAwsMetadata(path) {
    const token = execSync('curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" -s').toString();
    const data = execSync(`curl -H "X-aws-ec2-metadata-token: ${token}" -s http://169.254.169.254/latest/meta-data/${path}`).toString();
    return data;
}

async function start() {
    try {
        const instanceId = await getAwsMetadata('instance-id');
        const ip = await getAwsMetadata('local-ipv4'); 

        await axios.post(`${ORCHESTRATOR_URL}/api/workspace/register`, { instanceId, ip });
        console.log('Registered successfully');

        setInterval(async () => {
            try {
                await axios.post(`${ORCHESTRATOR_URL}/api/workspace/heartbeat`, { instanceId });
            } catch (err) {
                console.error('Failed to send heartbeat', err.message);
            }
        }, 15000);

    } catch (err) {
        console.error('Agent startup failed', err);
        process.exit(1);
    }
}

start();