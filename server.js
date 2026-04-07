require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const PORT = process.env.PORT || 5000;

// Determine if using Free or Pro API key based on the suffix
const DEEPL_URL = DEEPL_API_KEY.endsWith(":fx") 
  ? "https://api-free.deepl.com/v2/translate" 
  : "https://api.deepl.com/v2/translate";

function detectTargetLang(host, path = "") {
  // Check for German Domain
  if (host.includes("oaksantum.de")) return "DE";
  
  // Check for English path (case insensitive and handles slashes better)
  if (path.toLowerCase().includes("en-eu")) return "EN-GB"; // DeepL prefers EN-GB or EN-US
  
  // Default to Polish
  return "PL";
}

app.post("/translate", async (req, res) => {
  try {
    const { text, path, host } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Missing text" });
    }

    const target_lang = detectTargetLang(host, path);

    // DeepL expects x-www-form-urlencoded for this endpoint
    const params = new URLSearchParams();
    params.append("auth_key", DEEPL_API_KEY); // You can also pass it here
    params.append("text", text);
    params.append("target_lang", target_lang);

    const response = await axios.post(DEEPL_URL, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    res.json(response.data);

  } catch (error) {
    console.error("DeepL API Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Translation failed",
      details: error.response?.data || error.message,
    });
  }
});


// Keep-alive ping
app.get("/ping", (req, res) => {
  console.log("Ping received at", new Date());
  res.status(200).send("OK");
});

setInterval(() => {
  console.log("⏰ Waking up the server...");
  axios
    .get(`http://localhost:${PORT}/ping`)
    .then(() => console.log("✅ Server is awake!"))
    .catch((err) => console.error("❌ Ping error:", err.message));
}, 14 * 60 * 1000);

app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
