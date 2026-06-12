import { createAdminClient } from "@/lib/supabase/admin";
import { WC_PRODUCT_MAP } from "@/lib/wc-product-map";

interface GrantResult {
  userId: string;
  isNewUser: boolean;
  coursesGranted: string[];
  coursesSkipped: string[];
}

export async function grantAccess(
  email: string,
  fullName: string,
  productIds: number[],
  expiresAt?: Date
): Promise<GrantResult> {
  const supabase = createAdminClient();

  // 1. Map product IDs to course slugs (deduplicate)
  const courseSlugs = new Set<string>();
  for (const pid of productIds) {
    const slugs = WC_PRODUCT_MAP[pid];
    if (slugs) slugs.forEach((s) => courseSlugs.add(s));
  }

  if (courseSlugs.size === 0) {
    console.log(`[wc-sync] No mapped courses for products: ${productIds}`);
    return {
      userId: "",
      isNewUser: false,
      coursesGranted: [],
      coursesSkipped: [],
    };
  }

  // 2. Find or create user
  let userId: string;
  let isNewUser = false;

  // Look up user by email via user_profiles (avoids listUsers pagination bug)
  const { data: existingProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .single();

  if (existingProfile) {
    userId = existingProfile.id;
    console.log(`[wc-sync] Existing user: ${email} (${userId})`);
  } else {
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error || !newUser.user) {
      console.error(`[wc-sync] Failed to create user ${email}:`, error);
      throw new Error(`Failed to create user: ${error?.message}`);
    }
    userId = newUser.user.id;
    isNewUser = true;
    console.log(`[wc-sync] Created new user: ${email} (${userId})`);

    // Create user_profiles entry
    await supabase.from("user_profiles").upsert({
      id: userId,
      email,
      full_name: fullName,
      role: "student",
    });
  }

  // 3. Grant course access
  const defaultExpiry = new Date();
  defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
  const expiry = expiresAt || defaultExpiry;

  const coursesGranted: string[] = [];
  const coursesSkipped: string[] = [];

  for (const slug of courseSlugs) {
    const { data: course } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", slug)
      .single();

    if (!course) {
      console.log(`[wc-sync] Course not found: ${slug}`);
      continue;
    }

    const { data: existing } = await supabase
      .from("course_access")
      .select("id, expires_at")
      .eq("user_id", userId)
      .eq("course_id", course.id)
      .single();

    if (existing) {
      const existingExpiry = existing.expires_at
        ? new Date(existing.expires_at)
        : null;

      if (existingExpiry && existingExpiry < new Date()) {
        // Expired - renew
        await supabase
          .from("course_access")
          .update({ expires_at: expiry.toISOString() })
          .eq("id", existing.id);
        coursesGranted.push(slug);
        console.log(`[wc-sync] Renewed access: ${slug} for ${email}`);
      } else {
        coursesSkipped.push(slug);
        console.log(`[wc-sync] Already active: ${slug} for ${email}`);
      }
    } else {
      await supabase.from("course_access").insert({
        user_id: userId,
        course_id: course.id,
        expires_at: expiry.toISOString(),
      });
      coursesGranted.push(slug);
      console.log(`[wc-sync] Granted access: ${slug} for ${email}`);
    }
  }

  return { userId, isNewUser, coursesGranted, coursesSkipped };
}

export async function assignProfessor(
  userId: string,
  courseIds: string[],
  professorName: string
) {
  if (!professorName) return;

  const supabase = createAdminClient();
  const nameLower = professorName.toLowerCase().trim();

  // Find professor by partial name match
  const { data: professors } = await supabase
    .from("user_profiles")
    .select("id, full_name")
    .eq("role", "professor");

  const professor = professors?.find((p) =>
    p.full_name?.toLowerCase().includes(nameLower)
  );

  if (!professor) {
    console.log(`[wc-sync] Professor not found: "${professorName}"`);
    return;
  }

  for (const courseId of courseIds) {
    const { error } = await supabase
      .from("professor_students")
      .upsert(
        {
          professor_id: professor.id,
          student_id: userId,
          course_id: courseId,
          assigned_via: "wc_variation",
        },
        { onConflict: "professor_id,student_id,course_id" }
      );

    if (error) {
      console.log(`[wc-sync] Failed to assign professor: ${error.message}`);
    } else {
      console.log(`[wc-sync] Assigned professor ${professor.full_name} for course ${courseId}`);
    }
  }
}
