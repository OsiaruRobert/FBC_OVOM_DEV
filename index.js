import express from "express";
import aiController from "./aiController.js";


import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

app.use(express.static('public'));   // serve files from the "public" folder


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.post("/api/chat", aiController);
app.post("/api/test", (req, res) => res.json({ "reply": req.body.question }));

app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));

app.listen(process.env.PORT || 3000, () => console.log("Server is running on port 3000"));