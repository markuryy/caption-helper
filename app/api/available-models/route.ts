import OpenAI from "openai";
import { Ollama } from "ollama";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { openaiApiKey, ollamaEndpoint } = await req.json();

    if (!openaiApiKey && !ollamaEndpoint) {
      return new Response(
        JSON.stringify({ models: { openai: [], ollama: [] } }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    let availableOpenaiModels,
      availableOllamaModels: string[] = [];

    if (openaiApiKey) {
      const openai = new OpenAI({ apiKey: openaiApiKey });
      const openaiModels = openai.models.list();
      const openaiModelsResponse = await openaiModels;

      if (openaiModelsResponse.data) {
        availableOpenaiModels = openaiModelsResponse.data
          .filter(
            (model) =>
              (model.id.includes("gpt-4o") ||
                model.id.includes("gpt-4-turbo")) &&
              !model.id.includes("preview")
          )
          .map((model) => model.id);
      }
    }

    if (ollamaEndpoint) {
      const ollama = new Ollama({ host: ollamaEndpoint });

      const ollamaModels = ollama.list();
      const ollamaResponse = await ollamaModels;

      if (ollamaResponse.models) {
        availableOllamaModels = ollamaResponse.models.map(
          (model) => model.name
        );
      }
    }

    return new Response(
      JSON.stringify({
        openai: availableOpenaiModels || [],
        ollama: availableOllamaModels || []
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    let errorMessage = "An unknown error occurred";
    let errorCode = "UNKNOWN_ERROR";

    if (error instanceof Error) {
      errorMessage = error.message;
      if ("code" in error) {
        errorCode = (error as any).code;
      }
    }

    return new Response(
      JSON.stringify({ error: errorMessage, code: errorCode }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
