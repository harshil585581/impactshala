import { supabase } from '../lib/supabase';
import { getFreshToken } from '../lib/authToken';

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
  // Get fresh session to ensure token is valid
  const token = await getFreshToken();
  const { data: { user } } = await supabase.auth.getUser(token || undefined);

  const { error } = await supabase
    .from('help_center_inquiries')
    .insert({
      user_id: user?.id ?? null,
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
