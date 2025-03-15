const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = 3001;

app.use(cors());

app.get("/recipeStream", async (req, res) => {
  const { ingredients, mealType, cuisine, cookingTime, complexity } = req.query;

  console.log(req.query);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (chunk) => {
    if (chunk.done) {
      res.write(`data: ${JSON.stringify({ action: "close" })}\n\n`);
      res.end();
    } else {
      res.write(`data: ${JSON.stringify({ action: "chunk", chunk: chunk.text() })}\n\n`);
    }
  };

  const prompt = `
    Generate a recipe with the following details:
    - Ingredients: ${ingredients}
    - Meal Type: ${mealType}
    - Cuisine: ${cuisine}
    - Cooking Time: ${cookingTime}
    - Complexity: ${complexity}

    Provide a step-by-step guide, including preparation and cooking instructions.
  `;

  await fetchGeminiCompletionsStream(prompt, sendEvent);

  req.on("close", () => {
    res.end();
  });
});

async function fetchGeminiCompletionsStream(prompt, callback) {
  const GEMINI_API_KEY = ""; // Replace with actual API key
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

  try {
    const result = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: prompt }] }], // Correct input format
    });

    for await (const chunk of result.stream) {
      callback(chunk);
    }
  } catch (error) {
    console.error("Error fetching data from Gemini API:", error);
    callback({ done: true });
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
