import { neon } from "@neondatabase/serverless";
import axios from "axios";

// Environment Variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const DATABASE_URL = process.env.DATABASE_URL!;

/**
 * Helper function to log messages with consistent formatting
 */
function log(message: string, ...args: any[]) {
  console.log(`[API/ask] ${message}`, ...args);
}

// Define the POST method
export async function POST(request: Request) {
  try {
    const sql = neon(DATABASE_URL);
    const { query, clerkId } = await request.json();

    log("Received POST request with query:", query);

    // Input Validation
    if (!query || !clerkId) {
      log("Validation failed: Missing query or clerkId.");
      return new Response(
        JSON.stringify({ error: "Missing required fields: query, clerkId" }),
        { status: 400 }
      );
    }

    // Fetch User Information
    const users = await sql`
      SELECT * FROM users WHERE clerk_id = ${clerkId};
    `;

    if (users.length === 0) {
      log("User not found for clerkId:", clerkId);
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404 }
      );
    }

    const user = users[0];
    const assistantId = user.assistant_id;
    const vectorStoreId = user.vector_store_id;

    log(`User found: assistantId=${assistantId}, vectorStoreId=${vectorStoreId}`);

    if (!assistantId || !vectorStoreId) {
      log("Validation failed: Missing assistant or vector store.");
      return new Response(
        JSON.stringify({
          error: "User does not have a valid assistant_id or vector_store_id.",
        }),
        { status: 400 }
      );
    }

    // Call the Chat Completions endpoint
    log("Sending query to OpenAI Chat Completions...");
    const chatResponse = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a helpful assistant accessing stored user notes." },
          { role: "user", content: query },
        ],
        functions: [
          {
            name: "search_vector_store",
            description: "Search the vector store for relevant user data.",
            parameters: {
              type: "object",
              properties: {
                vector_store_ids: {
                  type: "array",
                  items: { type: "string" },
                },
                query: { type: "string" },
              },
              required: ["vector_store_ids", "query"],
            },
          },
        ],
        function_call: {
          name: "search_vector_store",
          arguments: JSON.stringify({
            vector_store_ids: [vectorStoreId],
            query,
          }),
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    const responseData = chatResponse.data;
    log("Assistant response received:", responseData);

    // Extract the relevant content
    const assistantMessage =
      responseData.choices[0]?.message?.content || "No relevant notes found.";

    // Return the assistant's response
    return new Response(JSON.stringify({ data: assistantMessage }), {
      status: 200,
    });
  } catch (error: any) {
    log("Error in POST method:", error);

    if (axios.isAxiosError(error)) {
      log("Axios error:", error.response?.data || error.message);
      return new Response(
        JSON.stringify({
          error: error.response?.data?.error?.message || "OpenAI API Error",
        }),
        { status: error.response?.status || 500 }
      );
    }

    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500 }
    );
  }
}
