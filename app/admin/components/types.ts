export interface UserAccess {
  habit_tracker?: boolean;
  money_tracker?: boolean;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  userType: "ADMIN" | "USER" | "INFLUENCER";
  access: any;
  createdAt: string;
  lastLogin: string | null;
  influencerType: string;
  influencerShare: number | string;
}

export type TabType = "dashboard" | "users" | "influencers" | "add_link";

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Never";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getAccessDetails = (access: any): UserAccess => {
  if (!access) return { habit_tracker: false, money_tracker: false };
  if (typeof access === "string") {
    try {
      return JSON.parse(access);
    } catch {
      return { habit_tracker: false, money_tracker: false };
    }
  }
  return access as UserAccess;
};
