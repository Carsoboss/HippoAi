import { neon } from "@neondatabase/serverless";
import axios from "axios";
import cuid from "cuid";
import FormData from "form-data";

// Environment Variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const DATABASE_URL = process.env.DATABASE_URL!;

// Define the POST and GET methods
export async function POST(request: Request) {
  try {
    const sql = neon(DATABASE_URL);
    const { content, clerkId } = await request.json();

    // Input Validation
    if (!content || !clerkId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: content, clerkId" }),
        { status: 400 }
      );
    }

    // Fetch User Information
    const users = await sql`
      SELECT * FROM users WHERE clerk_id = ${clerkId};
    `;

    if (users.length === 0) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404 }
      );
    }

    const user = users[0];
    const userId = user.id;
    const vectorStoreId = user.vector_store_id;

    if (!vectorStoreId || vectorStoreId.trim() === "") {
      return new Response(
        JSON.stringify({ error: "User does not have a valid vector_store_id." }),
        { status: 400 }
      );
    }

    // Generate a unique ID for the note
    const noteId = cuid();

    // Get current date in mm/dd/yyyy format
    const currentDate = new Date();
    const formattedDate = `${String(currentDate.getMonth() + 1).padStart(2, '0')}/${String(
      currentDate.getDate()
    ).padStart(2, '0')}/${currentDate.getFullYear()}`;

    // Prepend the date to the note content
    const contentWithDate = `${formattedDate} ${content}`;

    // Step 1: Save the note content in the database
    const insertNote = await sql`
      INSERT INTO notes (
        id,
        content,
        "user_id"
      )
      VALUES (
        ${noteId},
        ${contentWithDate},
        ${userId}
      )
      RETURNING id, content, "user_id", created_at, updated_at;
    `;

    const newNote = insertNote[0];

    // Step 2: Convert the note text into a .txt file and upload to OpenAI's Files API
    const buffer = Buffer.from(contentWithDate, "utf-8");

    const form = new FormData();
    form.append("file", buffer, {
      filename: "note.txt",
      contentType: "text/plain",
    });
    form.append("purpose", "user_data");

    const uploadResponse = await axios.post(
      "https://api.openai.com/v1/files",
      form,
      {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
      }
    );

    const uploadedFile = uploadResponse.data;
    const fileId = uploadedFile.id;

    // Step 3: Associate the uploaded file with the user's vector store
    const vectorStoreEndpoint = `https://api.openai.com/v1/vector_stores/${vectorStoreId}/files`;

    await axios.post(
      vectorStoreEndpoint,
      { file_id: fileId },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    // Respond with the newly created note
    return new Response(JSON.stringify({ data: newNote }), { status: 201 });
  } catch (error: any) {
    // Log minimal error information
    console.error("Error in POST /note endpoint:", error.message);

    if (axios.isAxiosError(error)) {
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

export async function GET(request: Request) {
  try {
    const sql = neon(DATABASE_URL);
    const url = new URL(request.url);
    const clerkId = url.searchParams.get("clerkId");

    if (!clerkId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: clerkId" }),
        { status: 400 }
      );
    }

    // Fetch User Information
    const users = await sql`
      SELECT * FROM users WHERE clerk_id = ${clerkId};
    `;

    if (users.length === 0) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404 }
      );
    }

    const user = users[0];
    const userId = user.id;

    // Fetch Notes for the User
    const notes = await sql`
      SELECT id, content, "user_id", created_at, updated_at
      FROM notes
      WHERE "user_id" = ${userId}
      ORDER BY created_at DESC;
    `;

    return new Response(JSON.stringify({ data: notes }), { status: 200 });
  } catch (error: unknown) {
    console.error("Error in GET /note endpoint:", (error as Error).message);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500 }
    );
  }
}
