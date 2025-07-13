import express from "express";
import cors from "cors";
import config from "./src/config";
import morgan from "morgan";
import interviewRoute from "./src/routes/interview";
import startInterview from "./src/routes/start";
import clearmap from "./src/utils/clear";
import endhere from "./src/routes/end";
import login from "./src/routes/login";
const app = express();

app.use(morgan("dev"));
app.use(
  cors({
    origin : process.env.FRONTEND_URL || `http://localhost:5173/`, // Remove any undefined values
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("", login);
app.use("/interview", startInterview);
app.use("/interview", interviewRoute);

app.use("/interview", endhere);
app.use("/map", clearmap);

app.get("/", (req, res) => {
  res.send("Welcome to AI Interview....");
});

app.get("/health", (_req, res) => {
  res.send("OK");
});

app.listen(config.PORT, () => {
  return console.log(`Express is listening at http://localhost:${config.PORT}`);
});
