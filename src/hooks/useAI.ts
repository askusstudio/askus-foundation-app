import { useState } from 'react';
import { supabase } from '../services/supabase';

export function useAI() {
  const [isQuerying, setIsQuerying] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  async function queryFoundationAgent(query: string) {
    setIsQuerying(true);
    setResponse(null);

    try {
      const { data, error } = await supabase.functions.invoke('askus-agent', {
        body: { query },
      });

      if (error) {
        throw error;
      }

      setResponse(data.answer);
      return data;
    } catch (err: unknown) {
      const fallback = "Unable to connect with the AskUs Intelligence Agent. Please try again later.";
      setResponse(fallback);
      return { answer: fallback, is_grounded: false };
    } finally {
      setIsQuerying(false);
    }
  }

  return { queryFoundationAgent, response, isQuerying };
}
