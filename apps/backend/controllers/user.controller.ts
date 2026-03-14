import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import * as userService from "./../services/user.service"

const JWT_SECRET = process.env.JWT_SECRET || "mysecret";

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body;

    const existingUser = await userService.findUserByEmail(body.email);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User alreday exists with this email",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPwd = await bcrypt.hash(body.password, salt);

    const user = await userService.createUser({name : body.name , email :body.email, password:hashedPwd })

    const token = jwt.sign({ id: user.id }, JWT_SECRET);

    res.status(200).json({
      success: true,
      user,
      token,
      message: "Your Account has been Created",
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body;

    const user = await userService.findUserByEmail(body.email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user exits with this email",
      });
    }

    const valid = await bcrypt.compare(body.password, user.hashPassword);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Entered incorrect password",
      });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET);

    res.status(200).json({
      success: true,
      user,
      token,
      message: "Account loggedin",
    });
  } catch (err) {
    next(err);
  }
};
export const logout = (req: Request, res: Response) => {
  res.status(200).json({
    sucess: true,
    message: "Logged Out Successfully",
  });
};


export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await userService.findUserById(userId);

    if(!user){
        return res.status(404).json({
            success:false,
            message :"User does not exists"
        });
    }

    res.status(200).json({
        success:true,
        user
    })

  } catch (err) {
    next(err);
  }
};