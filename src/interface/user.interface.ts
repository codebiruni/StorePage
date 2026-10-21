export interface Iuser {
  email?: string;
  number?: string;
  username?: string;
  password: string;
  role: "user" | "admin" | "super-admin" | "menager";
  status: "in-progress" | "blocked";
  isSocial: boolean;
  // activationExpiresAt: Date;
  isActive: boolean;
  isDeleted: boolean;
  telegram_chat_id?: string;
  telegram_link_token?: string;
  is_telegram_active?: boolean;
}
