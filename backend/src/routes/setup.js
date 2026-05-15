import { Router } from "express";
import { body } from "express-validator";
import { handleValidationErrors } from "../middleware/validate.js";
import { supabase } from "../services/supabase.js";

const router = Router();

const ALLOWED_CATEGORIES = new Set([
  "career",
  "family",
  "hobby",
  "place",
  "relationship",
  "other",
]);

const ALLOWED_WEIGHTS = new Set(["positive", "neutral", "sensitive"]);

async function deleteAllMemories() {
  const { error } = await supabase
    .from("memories")
    .delete()
    .gte("created_at", "1970-01-01T00:00:00.000Z");
  if (error) throw error;
}

router.get("/memories", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("memories")
      .select("id, memory_text, category, emotional_weight, created_at")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return res.json({ memories: data || [] });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/setup",
  [
    body("preferredName").isString().trim().notEmpty(),
    body("memories").isArray({ min: 5 }),
    body("memories.*.memoryText").isString().trim().notEmpty(),
    body("memories.*.category")
      .optional()
      .isString()
      .custom((v) => ALLOWED_CATEGORIES.has(v)),
    body("memories.*.emotionalWeight")
      .optional()
      .isString()
      .custom((v) => ALLOWED_WEIGHTS.has(v)),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { preferredName, memories } = req.body;

      const rows = memories.map((m) => ({
        memory_text: m.memoryText.trim(),
        category: ALLOWED_CATEGORIES.has(m.category) ? m.category : "other",
        emotional_weight: ALLOWED_WEIGHTS.has(m.emotionalWeight)
          ? m.emotionalWeight
          : "positive",
      }));

      const { data: existing, error: existingError } = await supabase
        .from("user_profile")
        .select("id")
        .maybeSingle();

      if (existingError) throw existingError;

      if (existing?.id) {
        await deleteAllMemories();

        const { error: updateError } = await supabase
          .from("user_profile")
          .update({
            preferred_name: preferredName.trim(),
            setup_complete: true,
          })
          .eq("id", existing.id);

        if (updateError) throw updateError;

        const { error: insertMemError } = await supabase
          .from("memories")
          .insert(rows);

        if (insertMemError) throw insertMemError;
      } else {
        const { data: inserted, error: insertProfileError } = await supabase
          .from("user_profile")
          .insert({
            preferred_name: preferredName.trim(),
            setup_complete: true,
          })
          .select("id")
          .single();

        if (insertProfileError) throw insertProfileError;

        const { error: insertMemError } = await supabase
          .from("memories")
          .insert(rows);

        if (insertMemError) throw insertMemError;

        if (!inserted?.id) {
          throw new Error("Failed to create user profile");
        }
      }

      return res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

router.delete("/setup/reset", async (req, res, next) => {
  try {
    const { error: logsError } = await supabase
      .from("conversation_logs")
      .delete()
      .gte("timestamp", "1970-01-01T00:00:00.000Z");

    if (logsError) throw logsError;

    await deleteAllMemories();

    const { error: profileError } = await supabase
      .from("user_profile")
      .delete()
      .gte("created_at", "1970-01-01T00:00:00.000Z");

    if (profileError) throw profileError;

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
