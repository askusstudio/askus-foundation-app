import { Database } from './database.types';

export * from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export type VolunteerKyc = Database['public']['Tables']['volunteer_kyc']['Row'];
export type VolunteerKycInsert = Database['public']['Tables']['volunteer_kyc']['Insert'];
export type VolunteerKycUpdate = Database['public']['Tables']['volunteer_kyc']['Update'];

export type Drive = Database['public']['Tables']['drives']['Row'];
export type DriveInsert = Database['public']['Tables']['drives']['Insert'];
export type DriveUpdate = Database['public']['Tables']['drives']['Update'];

export type DriveAttendee = Database['public']['Tables']['drive_attendees']['Row'];
export type DriveAttendeeInsert = Database['public']['Tables']['drive_attendees']['Insert'];
export type DriveAttendeeUpdate = Database['public']['Tables']['drive_attendees']['Update'];

export type Donation = Database['public']['Tables']['donations']['Row'];
export type DonationInsert = Database['public']['Tables']['donations']['Insert'];
export type DonationUpdate = Database['public']['Tables']['donations']['Update'];

export type FoundationKnowledge = Database['public']['Tables']['foundation_knowledge']['Row'];
export type FoundationKnowledgeInsert = Database['public']['Tables']['foundation_knowledge']['Insert'];
export type FoundationKnowledgeUpdate = Database['public']['Tables']['foundation_knowledge']['Update'];

export type ThreatLog = Database['public']['Tables']['threat_logs']['Row'];
export type ThreatLogInsert = Database['public']['Tables']['threat_logs']['Insert'];
export type ThreatLogUpdate = Database['public']['Tables']['threat_logs']['Update'];
