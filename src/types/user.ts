export type UserDTO = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "COLLABORATOR" | "READ_ONLY";
  createdAt: string;
};
