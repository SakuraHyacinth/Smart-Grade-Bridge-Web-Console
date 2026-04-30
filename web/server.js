import express from "express";
import { fileURLToPath } from "url";
import path from "path";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (_, res) => res.sendFile(path.join(__dirname, "dist/index.html")));

app.listen(5173, () => console.log("Console running at http://localhost:5173"));