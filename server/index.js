const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// log when the file loads
console.log("index.js file loaded");

app.get("/", (req, res) => {
  console.log("➡️ GET / was hit");
  res.send("API is running ✅");
});

app.post("/api/generate", (req, res) => {
  console.log("➡️ POST /api/generate was hit");
  const { ingredients } = req.body;

  console.log("Received ingredients:", ingredients);

  res.json({
    title: "Test Meal",
    ingredients: ingredients,
    steps: ["step 1: combine", "step 2: season"],
  });
});


const PORT = 5001;
app.listen(PORT, () => {
  console.log(`server listening on port ${PORT}`);
});
