export type CallType = 'audio' | 'video';

export type CallStatus = 'idle' | 'outgoing' | 'incoming' | 'connected';

export interface CallPeer {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface IncomingCallPayload {
  callId: string;
  caller: CallPeer;
  callType: CallType;
  offer: RTCSessionDescriptionInit;
}

export interface CallAcceptedPayload {
  callId: string;
  answer: RTCSessionDescriptionInit;
  responderId: string;
}

export interface CallRejectedPayload {
  callId: string;
  rejectorId: string;
  reason?: string;
}

export interface CallEndedPayload {
  callId: string;
  endedBy: string;
  reason?: string;
}

export interface IceCandidatePayload {
  senderId: string;
  candidate: RTCIceCandidateInit;
}

export interface ToggleMediaPayload {
  senderId: string;
  mediaType: 'audio' | 'video';
  enabled: boolean;
}

export interface CallHistoryUser {
  _id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface CallHistoryItem {
  _id: string;
  callerId: CallHistoryUser;
  receiverId: CallHistoryUser;
  callType: 'audio' | 'video';
  status: 'completed' | 'missed' | 'rejected';
  duration: number;
  startedAt?: string;
  endedAt: string;
  createdAt: string;
}

