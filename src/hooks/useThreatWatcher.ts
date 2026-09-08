import { supabase } from '../services/supabase';
import { ThreatSeverity } from '../types/database';

export function useThreatWatcher() {
  async function reportThreat(
    endpoint: string,
    threatType: string,
    severity: ThreatSeverity = 'medium',
    metadata: Record<string, unknown> = {}
  ) {
    try {
      const { data, error } = await supabase.functions.invoke('verify-threat', {
        body: {
          ip: 'client-ip', // Replaced by Edge middleware using CF-Connecting-IP
          endpoint,
          threatType,
          severity,
          metadata,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (e) {
      return { success: false, error: 'Threat report delivery failed' };
    }
  }

  return { reportThreat };
}
