require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const DEEPL_API_KEY = process.env.DEEPL_API_KEY; // Load API key from .env file

app.post("/translate", async (req, res) => {
  try {
    const { text, target_lang } = req.body;

    if (!text || !target_lang) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const response = await axios.post(
      "https://api-free.deepl.com/v2/translate",
      new URLSearchParams({ text, target_lang }).toString(),
      { headers: { Authorization: `DeepL-Auth-Key ${DEEPL_API_KEY}` } }
    );

    res.json(response.data);
  } catch (error) {
    console.error("DeepL API Error:", error);
    res
      .status(500)
      .json({ error: "Translation failed", details: error.message });
  }
});

app.get("/ping", (req, res) => {
  console.log("Ping received at", new Date());
  res.send("pong");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
