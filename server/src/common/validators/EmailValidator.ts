export const isEmailValid = (email: string) => {
  if (!email) return "Email cannot be empty";
  if (!email.includes("@")) return "Please enter valid email address";

  const whiteSpace = new RegExp("/s+/g");
  if (whiteSpace.test(email)) return "Email cannot have whitespaces";

  return "";
};
