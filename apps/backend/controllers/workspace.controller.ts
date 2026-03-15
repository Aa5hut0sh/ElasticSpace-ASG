import type { Request, Response, NextFunction } from "express";
import * as workspaceServices from "../services/workspace.service";

import {
  AutoScalingClient,
  SetDesiredCapacityCommand,
  DescribeAutoScalingInstancesCommand,
  DescribeAutoScalingGroupsCommand,
  TerminateInstanceInAutoScalingGroupCommand,
} from "@aws-sdk/client-auto-scaling";
import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";

import { prisma } from "@repo/db/client";

enum MachineStatus {
  READY = "READY",
  IN_USE = "IN_USE",
  DEAD = "DEAD",
}

export const asgClient = new AutoScalingClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

const ec2Client = new EC2Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_SECRET_KEY!,
  },
});

export const startMachine = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const machine = await workspaceServices.allocateMachine(userId);

  if (!machine) {
    const asgName = process.env.ASG_NAME!;

    const describeCmd = new DescribeAutoScalingGroupsCommand({
      AutoScalingGroupNames: [asgName],
    });

    const asgInfo = await asgClient.send(describeCmd);
    const asgGroup = asgInfo.AutoScalingGroups?.[0];
    
    const currentCapacity = asgGroup?.DesiredCapacity || 0;
    const maxCapacity = asgGroup?.MaxSize || 0;

    if (currentCapacity >= maxCapacity) {
      return res.status(429).json({
        success: false,
        message: "System is at maximum capacity. No machines available.",
      });
    }

    const scaleUpCmd = new SetDesiredCapacityCommand({
      AutoScalingGroupName: asgName,
      DesiredCapacity: currentCapacity + 1,
    });
    
    await asgClient.send(scaleUpCmd);

    return res.status(202).json({
      success: true,
      message: "No machines available. Provisioning a new one. Please try again in 30 seconds.",
    });
  }

  if (!machine.ip) {
    return res.status(503).json({
      success: false,
      message: "Machine IP is not available yet",
    });
  }

  const workspace = await prisma.workspace.create({
    data: {
      ownerId: userId,
      instanceId: machine.instanceId,
      instanceIp: machine.ip,
      Status: "IN_USE",
      startTime: new Date(),
      endTime: new Date(0),
    },
  });

  res.status(200).json({
    workspaceUrl: `http://${machine.ip}:8080`,
    instanceId: machine.instanceId,
    workspace,
  });
};

export const killMachine = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.userId;
  const instanceId: string = req.body.machineId;

  const command = new TerminateInstanceInAutoScalingGroupCommand({
    InstanceId: instanceId,
    ShouldDecrementDesiredCapacity: true,
  });
  await asgClient.send(command);

  await workspaceServices.terminateMachine(instanceId);

  await prisma.workspace.updateMany({
    where: {
      instanceId: instanceId,
      ownerId: userId,
    },
    data: {
      Status: "DEAD",
      endTime: new Date(),
    },
  });

  res.status(200).json({
    success: true,
    message: "Workspace terminated and state synced.",
  });
};

export const stopMachine = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {};

export const machineStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {};

export const registerMachine = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { instanceId, ip } = req.body;
  await workspaceServices.registerMachine(instanceId, ip);
  res.send({ success: true });
};
export const machineHeartbeat = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { instanceId } = req.body;
  await workspaceServices.updateHeartbeat(instanceId);
  res.send({ success: true });
};

export const getMachine = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const machines = await prisma.workspace.findMany({
    where: {
      ownerId: userId,
    },
  });

  res.status(200).json({
    success:true,
    machines,
  });
};
