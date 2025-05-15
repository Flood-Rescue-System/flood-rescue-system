export type UserSession = {
  type: "lead" | "member";
  userId: string;
  teamLeadId: string;
  fullName: string;
};
