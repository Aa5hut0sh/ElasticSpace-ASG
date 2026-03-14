import { redis } from "../redis/client";


export async function registerMachine(instanceId: string, ip: string) {

  await redis.hSet(`machine:${instanceId}`, {
    ip,
    status: "READY",
    lastHeartbeat: Date.now().toString()
  });

  await redis.sAdd("machines:available", instanceId);

}

export async function updateHeartbeat(instanceId: string) {

  await redis.hSet(
    `machine:${instanceId}`,
    "lastHeartbeat",
    Date.now().toString()
  );

}

export async function allocateMachine(userId: string) {

  const instanceId = await redis.sPop("machines:available");

  if (!instanceId) {
    return null;
  }

  await redis.sAdd("machines:inuse", instanceId);

  await redis.hSet(`machine:${instanceId}`, {
    status: "IN_USE",
    userId
  });

  const ip = await redis.hGet(`machine:${instanceId}`, "ip");

  return {
    instanceId,
    ip
  };

}

export async function terminateMachine(instanceId: string) {

  await redis.sRem("machines:inuse", instanceId);
  await redis.del(`machine:${instanceId}`);

}