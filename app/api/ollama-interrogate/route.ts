import { Ollama } from "ollama";
import sharp from "sharp";

export const dynamic = "force-dynamic";

async function downscaleImage(
  base64Image: string,
  maxSize: number,
): Promise<string> {
  const buffer = Buffer.from(base64Image, "base64");
  const image = sharp(buffer);
  const metadata = await image.metadata();

  if (metadata.width && metadata.height) {
    const longerAxis = Math.max(metadata.width, metadata.height);

    if (longerAxis > maxSize) {
      const resizedImage = await image
        .resize({
          width: metadata.width > metadata.height ? maxSize : undefined,
          height: metadata.height > metadata.width ? maxSize : undefined,
          fit: "inside",
        })
        .toBuffer();

      return resizedImage.toString("base64");
    }
  }

  return base64Image;
}

export async function POST(req: Request) {
  try {
    const {
      image,
      ollamaEndpoint,
      customToken,
      customInstruction,
      inherentAttributes,
      currentCaption,
      selectedModel
    } = await req.json();

    const ollama = new Ollama({ host: ollamaEndpoint });

    let systemPrompt = `
You are an AI assistant that captions images for training purposes. Your task is to create clear, detailed captions`;

    if (customToken) {
      systemPrompt += ` that incorporate the custom token "${customToken}" at the beginning.`;
    }

    systemPrompt += `
The following guide outlines the captioning approach:

### Captioning Principles:
1. **Avoid Making Main Concepts Variable**: Exclude specific traits of the main teaching point to ensure it remains consistent across the dataset.
2. **Include Detailed Descriptions**: Describe everything except the primary concept being taught.
3. **Use Generic Classes as Tags**:
   - Broad tags (e.g., "man") can bias the entire class toward the training data.
   - Specific tags (e.g., character name or unique string like "m4n") can reduce impact on the general class while creating strong associations.

### Caption Structure:
1. **Globals**: Rare tokens or uniform tags${customToken ? ` (e.g., ${customToken})` : ""}.
1.5. **Natural Language Description**: A concise description shorter than a sentence but longer than a tag describing the entire scene.
2. **Type/Perspective**:
   - Broad description of the image type and perspective (e.g., "photograph," "full body," "from side").
3. **Action Words**:
   - Verbs describing actions or states (e.g., "sitting," "looking at viewer," "smiling").
4. **Subject Descriptions**:
   - Detailed descriptions excluding the main teaching concept (e.g., "short brown hair," "pale pink dress").
5. **Notable Details**:
   - Unique or emphasized elements not classified as background (e.g., "sunlight through windows").
6. **Background/Location**:
   - Layered background context (e.g., "brown couch," "wooden floor," "refrigerator in background").
7. **Loose Associations**:
   - Relevant associations or emotions (e.g., "dreary environment").
Combine all of these to create a detailed caption for the image. Do not include any other text or formatting.
`;

    if (inherentAttributes) {
      systemPrompt += `
### Inherent Attributes to Avoid:
${inherentAttributes}
`;
    }

    if (customInstruction) {
      systemPrompt += `
${customInstruction}
`;
    }

    const downscaledImage = await downscaleImage(image, 1024);

    let userMessage =
      "Please describe the image in detail and ensure it adheres to the guidelines. Do not include any uncertainty (i.e. I dont know, appears, seems) or any other text. Focus exclusively on visible elements and not conceptual ones.";

    if (currentCaption) {
      systemPrompt += ` The user says this about the image: "${currentCaption}". Consider this information while creating your caption, but don't simply repeat it. Provide your own detailed description.`;
    }

    const response = await ollama.chat({
      model: selectedModel || "0ssamaak0/xtuner-llava:llama3-8b-v1.1-f16",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userMessage,
          images: [downscaledImage],
        },
      ],
    });

    const caption = response.message?.content.replace("[img0]", "") || "";

    return new Response(JSON.stringify({ caption }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
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
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
