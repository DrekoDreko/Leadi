import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SystemTemplate, TemplateType } from "./types";
import { systemTemplatesFallback } from "@/data/system-templates";

type SystemTemplateRow = {
  id: string;
  template_type: TemplateType;
  category: string;
  title: string;
  description: string;
  content: SystemTemplate["content"];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function getSystemTemplates(type?: TemplateType): Promise<SystemTemplate[]> {
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("system_templates")
    .select("*")
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("title", { ascending: true });

  if (type) {
    query = query.eq("template_type", type);
  }

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    if (error && error.code !== "PGRST116" && error.code !== "42P01") {
       console.error("Error fetching system templates:", error);
    }
    
    // Fallback to static data
    const fallback = type 
      ? systemTemplatesFallback.filter(t => t.templateType === type)
      : systemTemplatesFallback;
      
    return fallback;
  }

  return (data as SystemTemplateRow[]).map((item) => ({
    id: item.id,
    templateType: item.template_type,
    category: item.category,
    title: item.title,
    description: item.description,
    content: item.content,
    isActive: item.is_active,
    createdAt: item.created_at,
    updatedAt: item.updated_at
  }));
}
