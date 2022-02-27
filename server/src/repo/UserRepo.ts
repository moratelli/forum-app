import { isEmailValid } from "../common/validators/EmailValidator";
import { isPasswordValid } from "../common/validators/PasswordValidator";
import { User } from "./User";
import bcrypt from "bcryptjs";

const saltRounds = 10;

export class UserResult {
  constructor(public messages?: Array<string>, public user?: User) {}
}

export const register = async (email: string, userName: string, password: string): Promise<UserResult> => {
  const result = isPasswordValid(password);
  if (!result.isValid) {
    return {
      messages: [
        "Passwords must be at least 8 characters long, and they must have 1 upper case character, 1 number and symbol",
      ],
    };
  }

  const trimmedEmail = email.trim().toLowerCase();
  const emailErrorMsg = isEmailValid(trimmedEmail);
  if (emailErrorMsg) {
    return {
      messages: [emailErrorMsg],
    };
  }

  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  const userEntity = await User.create({
    email: trimmedEmail,
    userName,
    password: hashedPassword,
  }).save();
  userEntity.password = ""; // blank pw for security

  return {
    user: userEntity,
  };
};

export const login = async (userName: string, password: string): Promise<UserResult> => {
  const user = await User.findOne({
    where: { userName },
  });
  if (!user) {
    return {
      messages: [userNotFound(userName)],
    };
  }
  if (!user.confirmed) {
    return {
      messages: ["User has not confirmed their registration email yet"],
    };
  }

  const passwordMatch = await bcrypt.compare(password, user?.password);
  if (!passwordMatch) {
    return {
      messages: ["Password is invalid"],
    };
  }

  return {
    user: user,
  };
};

export const logout = async (userName: string): Promise<string> => {
  const user = await User.findOne({
    where: { userName },
  });

  if (!user) {
    return userNotFound(userName);
  }

  return "User logged off";
};

export const me = async (id: string): Promise<UserResult> => {
  const user = await User.findOne({
    where: { id },
    relations: ["threads", "threads.threadItems", "threadItems", "threadItems.thread"],
  });
  if (!user) {
    return {
      messages: ["User not found"],
    };
  }
  if (!user.confirmed) {
    return {
      messages: ["User has not confirmed their registration email yet"],
    };
  }

  user.password = "";

  return {
    user: user,
  };
};

const userNotFound = (userName: string) => `User with username ${userName} not found`;
