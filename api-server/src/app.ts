import express, { type Express } from "express";
import cors from "cors";
import router from "./routes/index.js";
import { configDotenv } from "dotenv";
configDotenv();
const app: Express = express();

app.use(cors({
    origin: process.env.FRONTEND,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
