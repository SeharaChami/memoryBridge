import { Router } from "express";
import { body } from "express-validator";
import { handleValidationErrors } from "../middleware/validate.js";
import { supabase } from "../services/supabase.js";
import {
  generateResponse,
  isGreetingMessage,
} from "../services/gemini.js";

const router = Router();

router.post(
  "/conversation",
  [
    body("userMessage").isString().trim().notEmpty(),
    body("conversationHistory")
      .optional()
      .isArray()
      .bail()
      .custom((arr) => {
        if (!Array.isArray(arr)) return false;
        for (const item of arr) {
          if (!item || typeof item !== "object") return false;
          if (item.role !== "user" && item.role !== "mia") return false;
          if (typeof item.content !== "string") return false;
        }
        return true;
      }),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { userMessage, conversationHistory = [] } = req.body;

      const { data: profile, error: profileError } = await supabase
        .from("user_profile")
        .select("id, setup_complete")
        .maybeSingle();

      if (profileError) throw profileError;
      if (!profile?.setup_complete) {
        return res.status(400).json({
          error: "Setup is not complete",
        });
      }

      const reply = await generateResponse(conversationHistory, userMessage);

      const logPayload = {
        user_message: isGreetingMessage(userMessage) ? null : userMessage,
        mia_response: reply,
      };

      const { error: logError } = await supabase
        .from("conversation_logs")
        .insert(logPayload);

      if (logError) throw logError;

      return res.json({ reply });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
