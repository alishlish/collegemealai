const express = require("express");
const router = express.Router();

const { generateRecipe } = require("../controllers/recipeController");

router.post("/generate", generateRecipe);

module.exports = router;
