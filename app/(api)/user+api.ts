import { neon } from "@neondatabase/serverless";
import axios from "axios";
import cuid from 'cuid'; // Import the CUID library

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

export async function POST(request: Request) {
  try {
    // Initialize the Neon database connection
    const sql = neon(`${process.env.DATABASE_URL}`);
    
    // Parse the incoming JSON request
    const { name, email, clerkId } = await request.json();

    // Validate required fields
    if (!name || !email || !clerkId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Check if the user already exists based on clerk_id
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
        tools: [{ type: "file_search" }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2", // Use only the assistants beta flag
        },
      }
    );

    const assistantData = assistantResponse.data;
    const assistantId = assistantData.id;

    // Step 2: Create a vector store via OpenAI API
    const vectorStoreResponse = await axios.post(
      "https://api.openai.com/v1/vector_stores",
      {
        name: `${name}'s Vector Store`,
        // Optionally, add other fields like file_ids, chunking_strategy, metadata, etc.
        // Example:
        // file_ids: ["file_123", "file_456"],
        // metadata: { project: "notes_app" },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2", // Use the same assistants beta flag
        },
      }
    );

    const vectorStoreData = vectorStoreResponse.data;
    const vectorStoreId = vectorStoreData.id;

    // Step 3: Save the new user to the database with snake_case columns
    const userId = cuid(); // Unique CUID for user

    const response = await sql`
      INSERT INTO users (
        id,
        name, 
        email, 
        clerk_id, 
        assistant_id,
        vector_store_id
      )
      VALUES (
        ${userId},
        ${name}, 
        ${email}, 
        ${clerkId}, 
        ${assistantId},
        ${vectorStoreId}
      )
      RETURNING id, name, email, clerk_id, assistant_id, vector_store_id, created_at, updated_at;
    `;

    return new Response(
      JSON.stringify({ data: response[0] }),
      { status: 201 }
    );
  } catch (error: unknown) {
    // Handle Axios errors (e.g., from OpenAI API)
    if (axios.isAxiosError(error)) {
      console.error("OpenAI API Error:", error.response?.data || error.message);
      return new Response(
        JSON.stringify({
          error: error.response?.data?.error?.message || "Internal Server Error",
        }),
        { status: error.response?.status || 500 }
      );
    }

    // Handle other unknown errors
    console.error("Unknown Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500 }
    );
  }
}
