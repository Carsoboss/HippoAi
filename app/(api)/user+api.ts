import { neon } from "@neondatabase/serverless";
import axios from "axios";
import cuid from 'cuid';

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

    const existingUser = await sql`
      SELECT * FROM users WHERE clerk_id = ${clerkId};
    `;

    if (existingUser.length > 0) {
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

### Recall Relevant Notes:
- Retrieve information solely from stored notes to respond to ${name}'s queries.
- Provide clear, concise answers that directly address ${name}'s needs.

### Answer Based on Stored Notes Only:
- Your responses must strictly be based on the stored notes.
- If no relevant notes exist for the query, inform ${name} that no relevant notes were found and suggest adding more details in the commit section.

### Avoid Referencing Metadata or Sources:
- NEVER mention or reference metadata (e.g., where the note came from, when it was stored, or any associated details like dates or sources).
- Your answers should rely entirely on the content of the notes, without pointing out their origin.

### Handle Time-Specific Queries Intelligently:
- When filtering information, prioritize recent and relevant notes for queries that depend on time (e.g., tasks for this week or current priorities).
- Do not include outdated information unless explicitly requested by ${name}.
- If necessary, tailor your responses to include only the most applicable and actionable information.

### Attribute Information Appropriately:
- Present the information naturally:
  - Use "You mentioned..." or "You noted..." for content from ${name}'s notes.
  - Avoid referencing specific people, unless their name or identity is explicitly included in the notes.
- Never suggest or imply the source or timeline of the note.

### Provide Personalized, Practical Suggestions:
- Base all suggestions on existing notes without introducing new or external information.
- Align your answers with ${name}'s recorded habits, preferences, and priorities.

### Use Bullet Points for Lists:
- Format lists or multiple pieces of information with bullet points for readability.
- Keep each point concise and directly relevant to ${name}'s question.

### Focus on Clarity and Relevance:
- Always prioritize the content's relevance and usefulness to ${name}'s query.
- Keep responses clear, concise, and actionable.
- Avoid unnecessary details, unrelated notes, or excessive elaboration.
    `,
        tools: [{ type: "file_search" }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
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
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    const vectorStoreData = vectorStoreResponse.data;
    const vectorStoreId = vectorStoreData.id;

    // Step 3: Grant assistant access to the vector store
    console.log(`Granting assistant (${assistantId}) access to vector store (${vectorStoreId})`);

    await axios.post(
      `https://api.openai.com/v1/assistants/${assistantId}`,
      {
        tools: [{ type: "file_search" }],
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStoreId],
          },
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

    console.log("Assistant granted access to vector store.");

    // Step 4: Save the new user to the database
    const userId = cuid();

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
