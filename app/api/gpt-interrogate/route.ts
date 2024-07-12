import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const {
      image,
      apiKey,
      customToken,
      customInstruction,
      inherentAttributes,
    } = await req.json();

    const openai = new OpenAI({ apiKey });

    const systemPrompt = `
You are an AI assistant that captions images for training purposes. Your task is to create clear, detailed captions that incorporate the custom token \`${customToken}\`. The following guide outlines the captioning approach:

### Captioning Principles:
1. **Avoid Making Main Concepts Variable**: Exclude specific traits of the main teaching point to ensure it remains consistent across the dataset.
2. **Include Detailed Descriptions**: Describe everything except the primary concept being taught.
3. **Use Generic Classes as Tags**:
   - Broad tags (e.g., "man") can bias the entire class toward the training data.
   - Specific tags (e.g., "ohwxman") can reduce impact on the general class while creating strong associations.

### Caption Structure:
1. **Globals**: Rare tokens or uniform tags (e.g., \`${customToken}\`).
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

### Inherent Attributes to Avoid:
${inherentAttributes}

${customInstruction}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Here is an image for you to describe. Please describe the image in detail and ensure it adheres to the guidelines set out in the System Prompt. Do not include any uncertainty (i.e. I dont know, appears, seems) or any other text. Focus exclusively on visible elements and not conceptual ones. Thank you very much for your help!",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const caption = response.choices[0]?.message?.content || "";

    return new Response(JSON.stringify({ caption }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);

    return new Response("Failed to process request", { status: 500 });
  }
}
