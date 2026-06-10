import { createClient } from '@supabase/supabase-js';

function getAuthClient() {
  const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
  const token: string | undefined = stored?.access_token;
  return createClient(
    import.meta.env.VITE_SUPABASE_URL as string,
    import.meta.env.VITE_SUPABASE_ANON_KEY as string,
    token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : undefined,
  );
}

export interface HelpInquiry {
  category: string;
  urgency?: string;
  timeline?: string;
  requirements?: string;
  budget?: string;
  name: string;
  email: string;
  phone?: string;
  best_time?: string;
  contact_method: string;
  additional_details?: string;
}

export async function submitHelpInquiry(data: HelpInquiry): Promise<void> {
  const stored = JSON.parse(localStorage.getItem('user') ?? '{}');
  const userId: string | undefined = stored?.id;

  const { error } = await getAuthClient()
    .from('help_center_inquiries')
    .insert({
      user_id: userId || null,
      category: data.category,
      urgency: data.urgency || null,
      timeline: data.timeline || null,
      requirements: data.requirements || null,
      budget: data.budget || null,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      best_time: data.best_time || null,
      contact_method: data.contact_method,
      additional_details: data.additional_details || null,
    });

  if (error) throw new Error(error.message);
}
