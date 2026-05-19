import express from "express";
import aiController from "./aiController.js";

const app = express();
app.use(express.json());

app.use(express.static('public'));   // serve files from the "public" folder

app.post("/api/chat", aiController);
app.post("/api/test", (req,res)=>res.json({"reply":req.body.question}));

app.use((req, res) => res.status(404).json({ error: "Endpoint not found" }));

app.listen(process.env.PORT || 3000, () => console.log("Server is running on port 3000"));