import express from "express";
import aiController from "./aiController.js";

const app = express();
app.use(express.json());

app.post("/chat", aiController);

app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));

app.listen(process.env.PORT || 3000, () => console.log("Server is running on port 3000"));