import { neon } from "@neondatabase/serverless";
import axios from "axios";
import cuid from 'cuid'; // Import the CUID library

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

export async function POST(request: Request) {
  try {
    const sql = neon(`${process.env.DATABASE_URL}`);
    const { name, email, clerkId } = await request.json();

    if (!name || !email || !clerkId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT * FROM users WHERE clerk_id = ${clerkId};
    `;

    if (existingUser.length > 0) {
      // User already exists, return existing user data
      return new Response(
        JSON.stringify({ data: existingUser[0] }),
        { status: 200 }
      );
    }

    console.log("Creating assistant for:", name);

    // Step 1: Create an assistant via OpenAI API
    const assistantResponse = await axios.post(
      "https://api.openai.com/v1/assistants",
      {
        model: "gpt-4o",
        name: `${name}'s Assistant`,
        instructions: `
          You are a personal notes assistant for ${name}.
          - Help ${name} remember their notes.
          - Retrieve relevant notes based on queries like "What books do I want to read?".
          - Provide explanations or insights from stored notes.
        `,
        tools: [{ type: "code_interpreter" }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    const assistantData = assistantResponse.data;
    const assistantId = assistantData.id;

    // Generate a CUID for the new user
    const userId = cuid(); // This will generate a unique CUID

    // Step 2: Save user to the database
    const response = await sql`
      INSERT INTO users (
        id,
        name, 
        email, 
        clerk_id, 
        assistantId
      )
      VALUES (
        ${userId},
        ${name}, 
        ${email}, 
        ${clerkId}, 
        ${assistantId}
      )
      RETURNING id, name, email, assistantId;
    `;

    return new Response(
      JSON.stringify({ data: response[0] }),
      { status: 201 }
    );
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("OpenAI API Error:", error.response?.data || error.message);
      return new Response(
        JSON.stringify({
          error: error.response?.data?.error?.message || "Internal Server Error",
        }),
        { status: error.response?.status || 500 }
      );
    }

    console.error("Unknown Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500 }
    );
  }
}
