import config from "../config";
import { Message } from "../sessions/sessionStore";

export async function askAI(messages: Message[]) {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.OPENROUTER.APIKEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct",
        max_token: 30,
        messages,
      }),
    }
  );
  return response;
}
