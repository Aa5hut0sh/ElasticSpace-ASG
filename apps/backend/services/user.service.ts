import { prisma } from "@repo/db/client";

export const createUser = async ({
  name,
  email,
  password,
}: {
  name: string;
  email: string;
  password: string;
}) => {
  try {
    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        hashPassword: password,
      },

      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return user;

  } catch (err) {
    throw err;
  }
};

export const findUserByEmail = async (email: string) => {
  try {
    return await prisma.user.findFirst({
      where: {
        email: email,
      },
    });
  } catch (err) {
    throw err;
  }
};


export const findUserById = async (userId: string) => {
  try {
    return await prisma.user.findFirst({
      where: {
        id:userId
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  } catch (err) {
    throw err;
  }
};
