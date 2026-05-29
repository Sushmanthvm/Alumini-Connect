import { assertSupabase } from "@/lib/supabase";
import type { HeroSlide } from "@/lib/types";
import { COMPANIES, HERO_SLIDES } from "@/lib/mock-data";

export async function fetchHeroSlides(): Promise<HeroSlide[]> {
  const supabase = assertSupabase();
  const { data, error } = await supabase
    .from("hero_slides")
    .select("title, subtitle, image_url, sort_order")
    .eq("is_active", true)
    .order("sort_order");

  if (error || !data?.length) {
    return HERO_SLIDES.map((s) => ({
      title: s.title,
      subtitle: s.subtitle,
      image: s.image,
    }));
  }

  return data.map((row) => ({
    title: row.title,
    subtitle: row.subtitle,
    image: row.image_url,
  }));
}

export async function fetchCompanyNames(): Promise<string[]> {
  const supabase = assertSupabase();
  const { data, error } = await supabase.from("companies").select("name").order("name");

  if (error || !data?.length) return COMPANIES;
  return data.map((c) => c.name);
}
