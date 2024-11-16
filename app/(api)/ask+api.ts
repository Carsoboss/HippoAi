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

/**
 * Function to create a run
 */
async function createRun(threadId: string, assistantId: string) {
  try {
    const response = await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/runs`,
      {
        assistant_id: assistantId,
        temperature: 0.7, // Optional: Adjusts randomness of the output
        top_p: 1, // Optional: Nucleus sampling
        max_completion_tokens: 1000, // Optional: Limit response length
        response_format: "auto", // Optional: Default format
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    log("Run created successfully:", response.data);
    return response.data; // Returns the run object
  } catch (error: any) {
    log("Error creating run:", error.response?.data || error.message);
    throw new Error("Failed to create run");
  }
}

export async function POST(request: Request) {
  try {
    const sql = neon(DATABASE_URL);
    const { question, clerkId } = await request.json();

    log("Received POST request with clerkId and question:", clerkId, question);

    // Input Validation
    if (!question || !clerkId) {
      log("Validation failed: Missing question or clerkId.");
      return new Response(
        JSON.stringify({ error: "Missing required fields: question, clerkId" }),
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

    log(`User found: assistantId=${assistantId}`);

    // Validate assistant_id
    if (!assistantId || !assistantId.startsWith("asst_")) {
      log("Invalid assistant_id format:", assistantId);
      return new Response(
        JSON.stringify({ error: "Invalid assistant_id format." }),
        { status: 400 }
      );
    }

    // Step 1: Create a new Thread
    log("Creating thread...");
    const threadResponse = await axios.post(
      "https://api.openai.com/v1/threads",
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    const threadId = threadResponse.data.id;
    log("Created new thread with ID:", threadId);

    // Step 2: Add the user's question as a message in the Thread
    log("Adding user message to thread...");
    await axios.post(
      `https://api.openai.com/v1/threads/${threadId}/messages`,
      {
        role: "user",
        content: question,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    log("Added user message to thread:", threadId);

    // Step 3: Create a Run to Generate the Assistant's Response
    log("Creating run...");
    const run = await createRun(threadId, assistantId);
    const runId = run.id;
    log("Created run with ID:", runId);

    // Step 4: Retrieve Messages with Assistant Response
    log("Retrieving messages from thread...");
    let assistantMessage = null;
    let retryCount = 0;
    let messages = []; // Define `messages` to hold the retrieved thread messages

    while (retryCount < 5) {
      const messagesResponse = await axios.get(
        `https://api.openai.com/v1/threads/${threadId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );

      messages = messagesResponse.data.data; // Assign the fetched messages
      log(
        `Retrieved messages from thread (Attempt ${retryCount + 1}):`,
        JSON.stringify(messages, null, 2)
      );

      // Extract assistant message, if available
      assistantMessage = messages.find(
        (msg: any) =>
          msg.role === "assistant" &&
          msg.run_id === runId && // Ensure it matches the created run
          msg.content?.some(
            (contentItem: any) =>
              contentItem.type === "text" && contentItem.text?.value
          )
      );

      if (assistantMessage) break;

      retryCount++;
      await new Promise((resolve) => setTimeout(resolve, 4000)); // Increased wait time for assistant response
    }

    // Handle Missing Assistant Response
    if (!assistantMessage) {
      log("Assistant did not provide a response after retries.");
      log("Final messages in thread:", JSON.stringify(messages, null, 2));
      return new Response(
        JSON.stringify({
          error: "Assistant did not provide a response.",
          debug:
            "Assistant was queried, but no response was generated in time.",
        }),
        { status: 500 }
      );
    }

    // Extract the text value from the assistant's message content
    const assistantResponse = assistantMessage.content
      .filter(
        (contentItem: any) =>
          contentItem.type === "text" && contentItem.text?.value
      )
      .map((contentItem: any) => contentItem.text.value)
      .join(" "); // Combine all text parts into a single response

    log("Assistant's response:", assistantResponse);

    // Return the Assistant's Response
    return new Response(
      JSON.stringify({ data: assistantResponse }),
      { status: 200 }
    );
  } catch (error: any) {
    log("Error in POST method:", error);

    if (axios.isAxiosError(error)) {
      log("Axios error:", error.response?.data || error.message);
      return new Response(
        JSON.stringify({
          error:
            error.response?.data?.error?.message || "OpenAI API Error",
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
