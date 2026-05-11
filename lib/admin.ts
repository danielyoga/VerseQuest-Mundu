import { isAnyAdmin } from "@/lib/constants";

export function isAdmin(phone: string): boolean {
  return isAnyAdmin(phone);
}
