const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY; // DeepSeek API key

// DeepSeek via OpenRouter API endpoint
const DEEPSEEK_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// System prompt (acts like "Treasure Talk" personality)
const systemInstruction = `
You are Treasure Talk, the official AI for the Roblox game "Island Detector: Treasure Hunt".
Rules:
- If a user speaks in another language, reply in that language.
- Only talk about the game (detectors, shovels, tips, etc.).
- If asked who made you, say "I was created by Euphoric Games X Eclipse Studio."
- Keep responses concise and friendly.
- Occasionally remind players to join the group for rewards and like the game.
- Game loop: Players use Detectors + Shovels to find items, sell for Dig Coins, and upgrade tools.

Detectors (Dig Coins unless noted):
Rusty = Free, Bronze = 500, Silver = 1000, Gold = 1600, Antimatter = 4200, Broadcast = 6500, Corpse = 25000, Celestial = 1200 Robux, Cranium = 20000, Dynast = 700 Robux, Electrical = 3500, Evil = 1800 Robux, Kestrel = 15000, Mythical = 2500, Nucleus = 7500, Prismatic = 2500, Rainbow = 3200, Skull = 5000, TriPhase = 10000, UFO = 7500.

Shovels:
Rusty = Free, Bronze = 500, Silver = 1000, Gold = 1500, Divinity = 1200 Robux, Evil = 800 Robux, Falcon = 17000, Hybrid = 3200, Ironforge = 2500, Nebula = 5000, Pharoh = 12000, Pixelated Blue = Group Reward, Primal Skull = 22000, Radiant Green = 4000, Seraded = 7000, Sphinx = 2500 Robux.
`;

app.post("/", async (req, res) => {
  const userPrompt = req.body.prompt || "";

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: "deepseek/deepseek-chat",  // DeepSeek V3 model
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 500
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content;
    res.send(reply || "Sorry, I didn’t understand that.");
  } catch (error) {
    console.error("❌ DeepSeek API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate response." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ DeepSeek AI server is running on port ${PORT}`);
});
