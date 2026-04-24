require("dotenv").config();

const express = require("express");
const multer = require("multer");
const { extractText } = require("unpdf");
const cors = require("cors");

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

let storedChunks = [];

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
});

function splitTextIntoChunks(text, chunkSize = 500, overlap = 100) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const buffer = new Uint8Array(req.file.buffer);
    const { text } = await extractText(buffer, { mergePages: true });
 
    storedChunks = splitTextIntoChunks(text);
    console.log("Chunks stored:", storedChunks.length);

    res.json({
      message: "PDF received successfully",
      totalChunks: storedChunks.length,
    });

  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Failed to read PDF" });
  }
});

app.post("/ask", express.json(), async (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ message: "Question is required" });
  }

  // Better retrieval
  const words = question.toLowerCase().split(" ");

  const relevantChunks = storedChunks.filter(chunk =>
    words.some(word => chunk.toLowerCase().includes(word))
  );

  const topChunks = relevantChunks.slice(0, 3).join("\n\n");

  try {
const prompt = `
You are a career assistant.

Using the resume below:
1. Answer the question
2. Suggest improvements
3. Suggest missing skills
4. Give professional feedback

Resume:
${topChunks}

Question:
${question}
`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    res.json({
      question,
      answer,
      context: relevantChunks.slice(0, 3),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating answer" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));