import express, { NextFunction, Request, Response } from "express";
import path from "path";
import apiRouter from "./routes";

const app = express();
const port = Number(process.env.PORT ?? 3000);
const publicDir = path.join(__dirname, "..", "public");

app.use(express.json());
app.use(express.static(publicDir));
app.use("/api", apiRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Recurso não encontrado." });
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const message = error instanceof Error ? error.message : "Erro interno do servidor.";
  res.status(500).json({ error: message });
});

app.listen(port, () => {
  console.log(`Forno & Brasa rodando em http://localhost:${port}`);
});
