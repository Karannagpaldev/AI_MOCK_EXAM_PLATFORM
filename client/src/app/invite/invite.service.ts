import api from "@/utils/axios";

export interface InviteInfo {
  organisationName: string;
  invitedBy: string | null;
  email: string;
  status: "pending" | "accepted" | "declined" | "revoked" | "expired";
  expiresAt: string;
}

export const getInviteService = async (token: string): Promise<InviteInfo> => {
  const res = await api.get(`/organisations/invites/${token}`);
  return res.data.data;
};

export const acceptInviteService = async (token: string) => {
  const res = await api.post(`/organisations/invites/${token}/accept`);
  return res.data;
};

export const declineInviteService = async (token: string) => {
  const res = await api.post(`/organisations/invites/${token}/decline`);
  return res.data;
};
