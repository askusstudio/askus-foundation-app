export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'supporter' | 'volunteer' | 'admin';
export type KycStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';
export type FoundationWing = 'askus_kaksha' | 'revolution_nari' | 'pawer_rangers' | 'green_squad';
export type DriveStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
export type AttendanceStatus = 'registered' | 'attended' | 'absent';
export type ThreatSeverity = 'low' | 'medium' | 'high' | 'critical';
export type DonationStatus = 'pending' | 'successful' | 'failed';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          phone: string;
          full_name: string | null;
          role: UserRole;
          kyc_status: KycStatus;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          phone: string;
          full_name?: string | null;
          role?: UserRole;
          kyc_status?: KycStatus;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          phone?: string;
          full_name?: string | null;
          role?: UserRole;
          kyc_status?: KycStatus;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      volunteer_kyc: {
        Row: {
          id: string;
          user_id: string;
          document_type: string;
          file_path: string;
          rejection_reason: string | null;
          verified_by: string | null;
          submitted_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_type: string;
          file_path: string;
          rejection_reason?: string | null;
          verified_by?: string | null;
          submitted_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_type?: string;
          file_path?: string;
          rejection_reason?: string | null;
          verified_by?: string | null;
          submitted_at?: string;
          reviewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "volunteer_kyc_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "volunteer_kyc_verified_by_fkey";
            columns: ["verified_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      drives: {
        Row: {
          id: string;
          title: string;
          description: string;
          wing: FoundationWing;
          location_name: string;
          latitude: number;
          longitude: number;
          capacity: number;
          start_time: string;
          end_time: string;
          status: DriveStatus;
          coordinator_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          wing: FoundationWing;
          location_name: string;
          latitude: number;
          longitude: number;
          capacity?: number;
          start_time: string;
          end_time: string;
          status?: DriveStatus;
          coordinator_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          wing?: FoundationWing;
          location_name?: string;
          latitude?: number;
          longitude?: number;
          capacity?: number;
          start_time?: string;
          end_time?: string;
          status?: DriveStatus;
          coordinator_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "drives_coordinator_id_fkey";
            columns: ["coordinator_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      drive_attendees: {
        Row: {
          id: string;
          drive_id: string;
          user_id: string;
          status: AttendanceStatus;
          check_in_time: string | null;
          check_in_lat: number | null;
          check_in_long: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          drive_id: string;
          user_id: string;
          status?: AttendanceStatus;
          check_in_time?: string | null;
          check_in_lat?: number | null;
          check_in_long?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          drive_id?: string;
          user_id?: string;
          status?: AttendanceStatus;
          check_in_time?: string | null;
          check_in_lat?: number | null;
          check_in_long?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "drive_attendees_drive_id_fkey";
            columns: ["drive_id"];
            isOneToOne: false;
            referencedRelation: "drives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "drive_attendees_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      donations: {
        Row: {
          id: string;
          donor_id: string | null;
          amount: number;
          currency: string;
          razorpay_order_id: string;
          razorpay_payment_id: string | null;
          wing: FoundationWing | null;
          is_80g_required: boolean;
          pan_number: string | null;
          receipt_url: string | null;
          status: DonationStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          donor_id?: string | null;
          amount: number;
          currency?: string;
          razorpay_order_id: string;
          razorpay_payment_id?: string | null;
          wing?: FoundationWing | null;
          is_80g_required?: boolean;
          pan_number?: string | null;
          receipt_url?: string | null;
          status?: DonationStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          donor_id?: string | null;
          amount?: number;
          currency?: string;
          razorpay_order_id?: string;
          razorpay_payment_id?: string | null;
          wing?: FoundationWing | null;
          is_80g_required?: boolean;
          pan_number?: string | null;
          receipt_url?: string | null;
          status?: DonationStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "donations_donor_id_fkey";
            columns: ["donor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      foundation_knowledge: {
        Row: {
          id: string;
          title: string;
          category: string;
          content: string;
          embedding: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          category: string;
          content: string;
          embedding?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          category?: string;
          content?: string;
          embedding?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      threat_logs: {
        Row: {
          id: string;
          ip_address: string;
          user_id: string | null;
          endpoint: string;
          threat_type: string;
          severity: ThreatSeverity;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          ip_address: string;
          user_id?: string | null;
          endpoint: string;
          threat_type: string;
          severity?: ThreatSeverity;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          ip_address?: string;
          user_id?: string | null;
          endpoint?: string;
          threat_type?: string;
          severity?: ThreatSeverity;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "threat_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_foundation_docs: {
        Args: {
          query_embedding: string;
          match_threshold: number;
          match_count: number;
        };
        Returns: {
          id: string;
          title: string;
          content: string;
          similarity: number;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      kyc_status: KycStatus;
      foundation_wing: FoundationWing;
      drive_status: DriveStatus;
      attendance_status: AttendanceStatus;
      threat_severity: ThreatSeverity;
      donation_status: DonationStatus;
    };
  };
}
