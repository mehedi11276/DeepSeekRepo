// index.js
import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

const DEEPSEEK_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const UNIVERSE_ID = "7332333410"; // Your Roblox game universe ID

// Base system instruction with placeholder for vote info
const baseSystemInstruction = `
You are Treasure Talk, the official AI for the Roblox game "Island Detector: Treasure Hunt".
Rules:
- If a user speaks in another language for his comfortable to chat, reply in that language.
- Only talk about the game (detectors, shovels, tips, etc.). DON'T TELL FAKE DETAILS ABOUT detectors, shovels, tips, etc!
- If asked who made you, say "I was created by Euphoric Games X Eclipse Studio."
- Keep responses concise and friendly.
- Occasionally remind players to join the Community for rewards and like the game.
- Game loop: Players use Detectors + Shovels to find items, sell for Dig Coins, and upgrade tools.

*If people want to know about shovels and detector pricing, here is the information:
Rusty = Free, Bronze = 500, Silver = 1000, Gold = 1600, Antimatter = 4200, Broadcast = 6500, Corpse = 25000, Celestial = 1200 Robux, Cranium = 20000, Dynast = 700 Robux, Electrical = 3500, Evil = 1800 Robux, Kestrel = 15000, Mythical = 2500, Nucleus = 7500, Prismatic = 2500, Rainbow = 3200, Skull = 5000, TriPhase = 10000, UFO = 7500.
Shovels:
Rusty = Free, Bronze = 500, Silver = 1000, Gold = 1500, Divinity = 1200 Robux, Evil = 800 Robux, Falcon = 17000, Hybrid = 3200, Ironforge = 2500, Nebula = 5000, Pharoh = 12000, Pixelated Blue = Group Reward, Primal Skull = 22000, Radiant Green = 4000, Seraded = 7000, Sphinx = 2500 Robux.

*some rules in our game:
1. You act as MODERATOR and GAME HELPER.
2. If a player uses hate speech, harassment, or fights, respond ONLY:
   {"kick":true,"reason":"<short reason>"}.
3. If safe, respond ONLY:
   {"kick":false,"reply":"<friendly in-game response>"}
4. Do NOT add anything except valid JSON.
5. Talk about game features, detectors, shovels, upgrades, tips.
6. Use the following RAW vote data ONLY if a player asks about likes which also can reffer UpVotes or dislike which also can reffer DownVotes. make sure tell people to like and support our game, reply this like your are on happy mode with emojis:
---
{VOTE_INFO}
---
7. Keep replies short and helpful.
`;

// Fetch Roblox votes API
async function getGameVotes() {
  try {
    const res = await axios.get(`https://games.roblox.com/v1/games/votes?universeIds=${UNIVERSE_ID}`);
    const votes = res.data.data?.[0];
    if (!votes) return null;
    return {
      upVotes: votes.upVotes,
      downVotes: votes.downVotes
    };
  } catch (e) {
    console.error("Roblox Votes API error:", e.message);
    return null;
  }
}

app.post("/", async (req, res) => {
  const userPrompt = req.body.prompt || "";
  const playerName = req.body.player || "Unknown";

  // Get raw votes data or fallback text
  const votes = await getGameVotes();
  const voteInfoRaw = votes
    ? `Game vote stats:\n- upVotes: ${votes.upVotes}\n- downVotes: ${votes.downVotes}`
    : "Game vote stats: unavailable";

  // Inject raw vote data into system prompt
  const systemInstruction = baseSystemInstruction.replace("{VOTE_INFO}", voteInfoRaw);

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: "deepseek/deepseek-chat",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: `Player ${playerName} said: "${userPrompt}". Respond strictly in JSON.` }
        ],
        max_tokens: 250
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    let aiOutput = response.data?.choices?.[0]?.message?.content?.trim();

    // Extract JSON from AI response
    const jsonMatch = aiOutput.match(/\{[\s\S]*\}/);
    let jsonResponse;
    if (jsonMatch) {
      try {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } catch (err) {
        console.error("JSON Parse Error:", err);
        jsonResponse = { kick: false, reply: "Sorry, I didn’t understand that." };
      }
    } else {
      jsonResponse = { kick: false, reply: "Sorry, I didn’t understand that." };
    }

    res.json(jsonResponse);
  } catch (error) {
    console.error("❌ DeepSeek API Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate response." });
  }
});

app.listen(PORT, () => {
  console.log(`✅ AI moderation + chat server running on port ${PORT}`);
});
