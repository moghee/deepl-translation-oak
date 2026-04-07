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

// Updated detectTargetLang with safety defaults
function detectTargetLang(host = "", path = "") {
  const safeHost = String(host || "").toLowerCase();
  const safePath = String(path || "").toLowerCase();

  if (safeHost.includes("oaksantum.de")) return "DE";
  if (safePath.includes("en-eu")) return "EN-GB"; // DeepL requires EN-GB or EN-US
  return "PL";
}

app.post("/translate", async (req, res) => {
  try {
    // 1. Extract data with safety defaults to prevent the .includes() crash
    const { text, path = "", host = "" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing text" });
    }

    const target_lang = detectTargetLang(host, path);

    // 2. DeepL Request with HEADER-BASED Authentication
    const response = await axios({
      method: 'post',
      url: DEEPL_URL,
      // The body now ONLY contains data, NO API key
      data: {
        text: [text], // DeepL prefers text in an array
        target_lang: target_lang
      },
      headers: {
        // This is the crucial fix:
        "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    // DeepL returns { translations: [{ text: "...", detected_source_language: "..." }] }
    res.json(response.data);

  } catch (error) {
    // Better error logging for debugging
    const errorDetails = error.response?.data || error.message;
    console.error("DeepL API Error:", errorDetails);

    res.status(500).json({
      error: "Translation failed",
      details: errorDetails,
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
