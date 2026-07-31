export type UserStatus = 'active' | 'suspended' | 'soft-deleted';
export type OnlineStatus = 'online' | 'offline';
export type PrivacyOption = 'public' | 'contacts' | 'private';

export interface PrivacySettings {
  onlineStatus: PrivacyOption;
  lastSeen: PrivacyOption;
}

export interface User {
  _id: string;
  id?: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  avatarPublicId?: string;
  bio?: string;
  isProfileComplete: boolean;
  isEmailVerified: boolean;
  status: UserStatus;
  privacySettings: PrivacySettings;
  lastSeenAt?: string;
  createdAt: string;
  updatedAt: string;
}
