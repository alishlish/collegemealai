require("dotenv").config();
const express = require("express");
const cors = require("cors");

const recipeRoutes = require("./routes/recipeRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const plannerRoutes = require("./routes/plannerRoutes");
const shoppingRoutes = require("./routes/shoppingRoutes");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_, res) => res.send("Server running"));

app.use("/api/recipes", recipeRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/shopping", shoppingRoutes); // ✅ THIS LINE IS CRITICAL

app.listen(5001, () => console.log("Server listening on port 5001"));
