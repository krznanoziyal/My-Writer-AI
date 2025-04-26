import os
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google import genai
from google.genai import types
import logging

# --- Configuration & Initialization ---

load_dotenv()  # Load environment variables from .env file

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Pydantic Models for Request/Response ---

class StoryContext(BaseModel):
    """Optional context from the Story Bible."""
    genre: Optional[str] = None
    style: Optional[str] = None
    synopsis: Optional[str] = None
    characters: Optional[str] = None # Could be a list or more structured later
    worldbuilding: Optional[str] = None
    outline: Optional[str] = None
    target_audience_age: Optional[str] = Field(None, description="e.g., children, young adults, adults")

class GenerateRequest(BaseModel):
    """Request model for all generation endpoints."""
    instruction: str = Field(..., description="The primary instruction for the AI (e.g., 'Continue the story', 'Rewrite this to be more formal')")
    current_text: Optional[str] = Field(None, description="The full text currently in the editor")
    selection: Optional[str] = Field(None, description="The text currently selected by the user in the editor")
    story_context: Optional[StoryContext] = Field(None, description="Context from the Story Bible")

class GenerateResponse(BaseModel):
    """Response model containing the generated text."""
    generated_text: str

# --- Gemini Client Initialization ---

def get_gemini_client():
    """Dependency to get the Gemini client, ensuring API key is loaded."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("GEMINI_API_KEY not found in environment variables.")
        raise ValueError("API Key not configured. Set the GEMINI_API_KEY environment variable.")
    try:
        # STRICTLY use google.genai as requested
        client = genai.Client(api_key=api_key)
        return client
    except Exception as e:
        logger.exception("Failed to initialize Gemini client")
        raise HTTPException(status_code=500, detail="Failed to initialize AI service.")

# --- FastAPI Application ---

app = FastAPI(
    title="Story Assistant API",
    description="Backend API for the AI Story Writing Assistant using google-genai.",
    version="0.1.0"
)

# --- CORS Configuration ---
# Allow requests from your React frontend development server
# Update origins if your frontend runs on a different port
origins = [
    "http://localhost:5173", # Vite default
    "http://localhost:3000", # Create React App default
    # Add your deployed frontend URL here if applicable
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)

# --- Helper Function for Prompt Construction ---

def build_prompt(request: GenerateRequest, action_description: str) -> str:
    """Constructs a detailed prompt for the Gemini model."""
    prompt_parts = [f"You are an expert AI writing assistant specialized in crafting high-quality, coherent, and engaging story content adhering to modern writing practices."]

    # Add Story Bible Context if available
    if request.story_context:
        prompt_parts.append("\n--- Story Context ---")
        if request.story_context.target_audience_age:
            prompt_parts.append(f"Target Audience Age: {request.story_context.target_audience_age} (Adapt vocabulary and tone accordingly)")
        if request.story_context.genre:
            prompt_parts.append(f"Genre: {request.story_context.genre}")
        if request.story_context.style:
            prompt_parts.append(f"Writing Style: {request.story_context.style}")
        if request.story_context.synopsis:
            prompt_parts.append(f"Synopsis: {request.story_context.synopsis}")
        if request.story_context.characters:
            prompt_parts.append(f"Characters: {request.story_context.characters}")
        if request.story_context.worldbuilding:
            prompt_parts.append(f"Worldbuilding: {request.story_context.worldbuilding}")
        if request.story_context.outline:
             prompt_parts.append(f"Outline: {request.story_context.outline}")
        prompt_parts.append("---------------------\n")

    # Add Current Text Context if available
    if request.current_text:
        prompt_parts.append("--- Current Story Text ---")
        # Only include the last N characters/words for context to avoid overly long prompts
        context_limit = 1500 # Characters - adjust as needed
        context_text = request.current_text[-context_limit:]
        if len(request.current_text) > context_limit:
            context_text = "... " + context_text # Indicate truncation
        prompt_parts.append(context_text)
        prompt_parts.append("------------------------\n")

    # Add Selection Context if available (relevant for rewrite/describe)
    if request.selection:
        prompt_parts.append("--- Selected Text ---")
        prompt_parts.append(request.selection)
        prompt_parts.append("---------------------\n")

    # Add the specific action and instruction
    prompt_parts.append(f"--- Task: {action_description} ---")
    prompt_parts.append(f"Instruction: {request.instruction}")
    prompt_parts.append("----------------------------------\n")
    prompt_parts.append(
    "IMPORTANT: Only output the requested story content. Do NOT include any preamble, summary, or explanation. Do NOT repeat or rephrase the instruction. Output only the story text."
    )
    prompt_parts.append("Generate the response:")

    return "\n".join(prompt_parts)

# --- API Endpoints ---

MODEL_NAME = "gemini-2.0-flash"
GENERATION_CONFIG = types.GenerateContentConfig(
    temperature=0.7, # Balance creativity and coherence
    # max_output_tokens=1024 # Adjust as needed
)

@app.post("/generate/write", response_model=GenerateResponse)
async def generate_write(
    request: GenerateRequest,
    client: genai.Client = Depends(get_gemini_client)
):
    """Generates new story content based on context and instruction."""
    logger.info(f"Received /generate/write request: {request.instruction}")
    prompt = build_prompt(request, "Continue Writing or Generate New Scene")
    logger.debug(f"Constructed Prompt for Write:\n{prompt}")

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt],
            config=GENERATION_CONFIG
        )
        generated_text = response.text.strip()
        logger.info(f"Gemini response received for Write. Length: {len(generated_text)}")
        return GenerateResponse(generated_text=generated_text)
    except Exception as e:
        logger.exception("Error during Gemini API call for /generate/write")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@app.post("/generate/rewrite", response_model=GenerateResponse)
async def generate_rewrite(
    request: GenerateRequest,
    client: genai.Client = Depends(get_gemini_client)
):
    """Rewrites the selected text based on context and instruction."""
    logger.info(f"Received /generate/rewrite request: {request.instruction}")
    if not request.selection:
        raise HTTPException(status_code=400, detail="No text selected for rewriting.")

    prompt = build_prompt(request, "Rewrite Selected Text")
    logger.debug(f"Constructed Prompt for Rewrite:\n{prompt}")

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt],
            config=GENERATION_CONFIG
        )
        generated_text = response.text.strip()
        logger.info(f"Gemini response received for Rewrite. Length: {len(generated_text)}")
        return GenerateResponse(generated_text=generated_text)
    except Exception as e:
        logger.exception("Error during Gemini API call for /generate/rewrite")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@app.post("/generate/describe", response_model=GenerateResponse)
async def generate_describe(
    request: GenerateRequest,
    client: genai.Client = Depends(get_gemini_client)
):
    """Describes the selected text or concept in more detail."""
    logger.info(f"Received /generate/describe request: {request.instruction}")
    # Selection is helpful but might not always be present if describing a general concept
    # if not request.selection:
    #     raise HTTPException(status_code=400, detail="No text selected for description.")

    prompt = build_prompt(request, "Describe Text/Concept in Detail")
    logger.debug(f"Constructed Prompt for Describe:\n{prompt}")

    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt],
            config=GENERATION_CONFIG
        )
        generated_text = response.text.strip()
        logger.info(f"Gemini response received for Describe. Length: {len(generated_text)}")
        return GenerateResponse(generated_text=generated_text)
    except Exception as e:
        logger.exception("Error during Gemini API call for /generate/describe")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@app.post("/generate/brainstorm", response_model=GenerateResponse)
async def generate_brainstorm(
    request: GenerateRequest,
    client: genai.Client = Depends(get_gemini_client)
):
    """Brainstorms ideas related to the story or instruction."""
    logger.info(f"Received /generate/brainstorm request: {request.instruction}")
    prompt = build_prompt(request, "Brainstorm Ideas")
    logger.debug(f"Constructed Prompt for Brainstorm:\n{prompt}")

    try:
        # Maybe slightly higher temperature for brainstorming?
        brainstorm_config = types.GenerateContentConfig(
            temperature=0.85,
            # max_output_tokens=1024
        )
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt],
            config=brainstorm_config
        )
        # Gemini might return a list here, format it nicely
        generated_text = response.text.strip().replace('\n* ', '\n• ').replace('\n- ', '\n• ')
        logger.info(f"Gemini response received for Brainstorm. Length: {len(generated_text)}")
        return GenerateResponse(generated_text=generated_text)
    except Exception as e:
        logger.exception("Error during Gemini API call for /generate/brainstorm")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


# --- Root Endpoint for Health Check ---
@app.get("/")
async def root():
    return {"message": "Story Assistant API is running!"}

# --- Running the Server (for local development) ---
if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Uvicorn server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
    # Use reload=True for development: uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)