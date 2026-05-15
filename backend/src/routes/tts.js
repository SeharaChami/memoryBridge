import { Router } from "express";
import { body } from "express-validator";
import { handleValidationErrors } from "../middleware/validate.js";
import { synthesizeSpeech } from "../services/elevenlabs.js";

const router = Router();

router.post(
  "/tts",
  [
    body("text")
      .isString()
      .trim()
      .notEmpty()
      .isLength({ max: 5000 }),
  ],
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { text } = req.body;
      const audio = await synthesizeSpeech(text);
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", String(audio.length));
      return res.send(audio);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
