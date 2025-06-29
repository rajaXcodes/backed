import dotenv from "dotenv";

dotenv.config();

export default {
  PORT: process.env.HOST || 3000,

  OPENROUTER: {
    APIKEY: process.env.OPENROUTERAPI,
  },
  JWT: {
    SECRET_KEY: process.env.SECRETKEY,
  },
};
