require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;

// Helper: detect target language based on host + path
function detectTargetLang(req) {
  const host = req.headers.host || "";
  const referer = req.headers.referer || "";

  // Combine host + referer for better detection
  const url = `${host}${referer}`;

  if (host.includes("oaksantum.de")) {
    return "DE";
  }

  if (url.includes("/en-eu")) {
    return "EN";
  }

  // Default (oaksantum.com)
  return "PL";
}

app.post("/translate", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing text" });
    }

    const target_lang = detectTargetLang(req);

    const response = await axios.post(
      "https://api-free.deepl.com/v2/translate",
      new URLSearchParams({
        text,
        target_lang,
        // source_lang NOT provided → DeepL auto-detects
      }).toString(),
      {
        headers: {
          Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        },
      }
    );

    res.json({
      ...response.data,
      detected_target_lang: target_lang,
      detected_source_lang:
        response.data.translations?.[0]?.detected_source_language,
    });
  } catch (error) {
    console.error("DeepL API Error:", error);
    res.status(500).json({
      error: "Translation failed",
      details: error.message,
    });
  }
});

// ✅ Prevent server from sleeping by pinging itself every 14 minutes
setInterval(() => {
  console.log("⏰ Waking up the server...");
  axios
    .get(`http://localhost:${PORT}/ping`)
    .then(() => console.log("✅ Server is awake!"))
    .catch((err) => console.error("❌ Error keeping server awake:", err));
}, 14 * 60 * 1000); // 14 minutes in milliseconds

app.get("/ping", (req, res) => {
  console.log("Ping received at", new Date());
  res.status(200).send("OK");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
