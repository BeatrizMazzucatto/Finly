import { apiRequest } from "@/src/services/api";
import type { User } from "@/src/types/api";

interface LoginPayload {
  email: string;
  senha: string;
}

export async function login(payload: LoginPayload): Promise<User> {
  return apiRequest<User>("/usuarios/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
