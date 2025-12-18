require("dotenv").config();

const express = require("express");
const cors = require("cors");

const recipeRoutes = require("./routes/recipeRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// sanity check
app.get("/", (req, res) => {
  res.send("Server running");
});

// mount recipe routes
app.use("/api", recipeRoutes);

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
