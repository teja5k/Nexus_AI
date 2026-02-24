import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Multer config for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  });

  app.use(express.json());

  // API endpoint for text extraction
  app.post("/api/extract-text", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { buffer, originalname, mimetype } = req.file;
      let text = "";

      if (mimetype === "application/pdf") {
        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        text = data.text;
        await parser.destroy();
      } else if (
        mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else if (mimetype === "text/plain") {
        text = buffer.toString("utf-8");
      } else {
        return res.status(400).json({ error: "Unsupported file format" });
      }

      res.json({ text, fileName: originalname });
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({ error: "Failed to extract text from file" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
