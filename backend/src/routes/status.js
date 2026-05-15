import { Router } from "express";
import { supabase } from "../services/supabase.js";

const router = Router();

router.get("/status", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("user_profile")
      .select("preferred_name, setup_complete")
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.json({
        setupComplete: false,
        preferredName: null,
      });
    }

    return res.json({
      setupComplete: Boolean(data.setup_complete),
      preferredName: data.preferred_name ?? null,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
