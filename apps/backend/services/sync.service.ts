import { redis } from "../redis/client";
import { TerminateInstanceInAutoScalingGroupCommand } from "@aws-sdk/client-auto-scaling";
import { asgClient } from "../controllers/workspace.controller";
import { prisma } from "@repo/db/client";

const HEARTBEAT_TIMEOUT_MS = 60000;

export async function startHeartbeatMonitor() {
  setInterval(async () => {
    console.log("Sweeping machines for dead heartbeats...");

    const available = await redis.sMembers("machines:available");
    const inuse = await redis.sMembers("machines:inuse");
    const allMachines = [...available, ...inuse];

    const now = Date.now();

    for (const instanceId of allMachines) {
      const lastHeartbeatStr = await redis.hGet(
        `machine:${instanceId}`,
        "lastHeartbeat",
      );

      if (lastHeartbeatStr) {
        const lastHeartbeat = parseInt(lastHeartbeatStr, 10);

        if (now - lastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
          console.log(`Machine ${instanceId} missed heartbeat. Terminating...`);

          await redis.sRem("machines:available", instanceId);
          await redis.sRem("machines:inuse", instanceId);
          await redis.del(`machine:${instanceId}`);

          try {
            await asgClient.send(
              new TerminateInstanceInAutoScalingGroupCommand({
                InstanceId: instanceId,
                ShouldDecrementDesiredCapacity: true,
              }),
            );
          } catch (e) {
            console.error(`Failed to terminate ${instanceId} in AWS:`, e);
          }

          await prisma.workspace.updateMany({
            where: {
              instanceId: instanceId,
            },
            data: {
              Status: "DEAD",
              endTime: new Date(),
            },
          });
        }
      }
    }
  }, 30000); // Run every 30 seconds
}
