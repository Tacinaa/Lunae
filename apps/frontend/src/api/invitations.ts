import { apiClient } from './client';

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'maybe';

export interface InvitationEventDto {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location: string | null;
}

export interface InvitationDto {
  id: string;
  eventId: string;
  status: InvitationStatus;
  createdAt: string;
  event: InvitationEventDto;
}

export async function getInvitations(): Promise<InvitationDto[]> {
  const { data } = await apiClient.get<InvitationDto[]>('/invitations');
  return data;
}

export async function respondToInvitation(
  id: string,
  status: InvitationStatus,
): Promise<InvitationDto> {
  const { data } = await apiClient.patch<InvitationDto>(`/invitations/${id}`, { status });
  return data;
}
