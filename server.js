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
  console.log("--- NEW REQUEST RECEIVED ---");
  console.log("Body:", req.body); // Check if host/path/text are arriving

  try {
    const { text, path = "", host = "" } = req.body;
    const target_lang = detectTargetLang(host, path);
    
    console.log(`Attempting DeepL call: [${text.substring(0, 20)}...] to ${target_lang}`);

    const response = await axios({
      method: 'post',
      url: DEEPL_URL,
      data: { text: [text], target_lang: target_lang },
      headers: {
        "Authorization": `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    console.log("DeepL Response Status:", response.status);
    console.log("DeepL Data:", JSON.stringify(response.data));

    res.json(response.data);
  } catch (error) {
    // This logs the SPECIFIC reason DeepL rejected you
    console.error("DEBUG ERROR:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed", details: error.response?.data });
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
