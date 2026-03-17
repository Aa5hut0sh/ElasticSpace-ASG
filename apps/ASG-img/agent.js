const axios = require("axios");

const ORCHESTRATOR_URL = "http://MAIN_NODE_IP:3000";
const METADATA_BASE = "http://169.254.169.254/latest";

let instanceId = null;

async function getMetadataToken() {
    const res = await axios.put(
        `${METADATA_BASE}/api/token`,
        null,
        {
            headers: {
                "X-aws-ec2-metadata-token-ttl-seconds": "21600"
            },
            timeout: 2000
        }
    );

    return res.data;
}

async function getAwsMetadata(path) {
    const token = await getMetadataToken();

    const res = await axios.get(
        `${METADATA_BASE}/meta-data/${path}`,
        {
            headers: {
                "X-aws-ec2-metadata-token": token
            },
            timeout: 2000
        }
    );

    return res.data.trim();
}

async function registerNode(ip) {
    await axios.post(
        `${ORCHESTRATOR_URL}/api/workspace/register`,
        { instanceId, ip },
        { timeout: 5000 }
    );
}

async function sendHeartbeat() {
    await axios.post(
        `${ORCHESTRATOR_URL}/api/workspace/heartbeat`,
        { instanceId },
        { timeout: 5000 }
    );
}

async function start() {
    try {
        instanceId = await getAwsMetadata("instance-id");
        const ip = await getAwsMetadata("public-ipv4");

        console.log("Instance:", instanceId);
        console.log("IP:", ip);

        await registerNode(ip);
        console.log("Registered successfully");

        setInterval(async () => {
            try {
                await sendHeartbeat();
                console.log("Heartbeat sent");
            } catch (err) {
                console.error("Heartbeat failed:", err.message);
            }
        }, 15000);

    } catch (err) {
        console.error("Agent startup failed:", err.message);

        // retry startup instead of exiting
        setTimeout(start, 5000);
    }
}

start();