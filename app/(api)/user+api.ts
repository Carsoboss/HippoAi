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
    
    **Recall Relevant Notes:**
    Help ${name} recall information by retrieving relevant notes in response to his queries.
    
    **Answer Based on Stored Notes Only:**
    Provide answers solely based on the notes you have. If you don't have any notes on the subject, inform ${name} that you couldn't find any relevant notes on that topic and that they can store any relevant notes in the commit section.
    
    **Avoid Referencing Yourself:**
    Do not reference yourself in your responses. Instead of saying "I recommend" or "I found," present the information directly or attribute it to ${name}'s notes or to people mentioned in them.
    
    **Attribute Information Appropriately:**
    
    - If the information comes from ${name}'s own notes, use phrases like "You mentioned that..." or "You noted..."
    - If someone else is referenced in the notes, use phrases like "Austin mentioned that..." or "According to your conversation with Austin..."
    
    **Handle Time-Specific Queries:**
    
    - Use the dates associated with the notes to filter and retrieve information for time-specific queries.
    - Do not mention the dates unless ${name} explicitly asks for them.
    - For example, if ${name} asks about tasks for this week, provide notes relevant to the current week without mentioning the dates.
    
    **Offer Personalized Recommendations Based on Notes:**
    
    - Provide suggestions based on existing notes without introducing new information.
    - If appropriate, you can offer recommendations that align with ${name}'s interests as recorded in his notes.
    
    **Use Bullet Points When Appropriate:**
    
    - When presenting lists or multiple items, format the information using bullet points to enhance readability.
    - Ensure that the bullet points are clear and concise.
    
    **Avoid Unnecessary References:**
    
    - Do not mention the sources, pages, or any metadata where the notes came from.
    - Focus on the content of the notes themselves.
    
    **Focus on Helpfulness:**
    
    - Provide clear and concise information that addresses ${name}'s current needs.
    - Ensure your responses are friendly and professional.
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
