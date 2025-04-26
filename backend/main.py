import os
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from google import genai
from google.genai import types
import logging
import re

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

class StoryBranch(BaseModel):
    """Story branch model containing title, content, and summary."""
    id: str
    title: str
    summary: str
    content: str

class StoryBranchesResponse(BaseModel):
    """Response model containing multiple story branches."""
    branches: List[StoryBranch]

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

@app.post("/generate/context/{element_type}", response_model=GenerateResponse)
async def generate_context_element(
    element_type: str,
    request: GenerateRequest,
    client: genai.Client = Depends(get_gemini_client)
):
    """Generates content for specific story context elements (characters, genre, style, etc.)."""
    logger.info(f"Received /generate/context/{element_type} request: {request.instruction}")
    
    # Define specialized prompts based on the element type
    element_descriptions = {
        "characters": "Create detailed, well-rounded character(s) that would fit this story",
        "genre": "Suggest appropriate genre(s) and subgenres for this story",
        "style": "Suggest appropriate writing style(s) for this story",
        "worldbuilding": "Create detailed, compelling worldbuilding elements for this story",
        "synopsis": "Create a concise synopsis for this story",
        "outline": "Create a story outline with key plot points",
    }
    
    if element_type not in element_descriptions:
        raise HTTPException(status_code=400, detail=f"Unsupported context element type: {element_type}")
    
    # Build a specialized prompt for the requested element type
    prompt = build_prompt(request, element_descriptions[element_type])
    
    # Add specialized instructions based on element type
    if element_type == "characters":
        prompt += "\n\nProvide 1-3 well-developed characters with name, age, background, personality, motivations, and physical appearance. Format with markdown headings for character names."
    elif element_type == "genre":
        prompt += "\n\nProvide 3-5 genre suggestions with brief explanations of why they would fit this story. Use markdown bullet points."
    elif element_type == "style":
        prompt += "\n\nProvide 3-5 writing style suggestions with examples of how they would affect the narrative. Use markdown bullet points."
    elif element_type == "worldbuilding":
        prompt += "\n\nProvide detailed worldbuilding elements covering settings, cultures, systems, and atmosphere relevant to this story. Use markdown headings to organize."
    elif element_type == "synopsis":
        prompt += "\n\nProvide a compelling 1-2 paragraph synopsis that captures the essence of the story."
    elif element_type == "outline":
        prompt += "\n\nProvide a structured outline with key plot points, using markdown formatting for clarity."
    
    logger.debug(f"Constructed Prompt for {element_type.capitalize()} generation:\n{prompt}")

    try:
        # Use slightly different generation config for creative elements
        context_config = types.GenerateContentConfig(
            temperature=0.8,  # Slightly higher temperature for creative content
            # max_output_tokens=1024
        )
        
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt],
            config=context_config
        )
        
        generated_text = response.text.strip()
        logger.info(f"Gemini response received for {element_type} generation. Length: {len(generated_text)}")
        return GenerateResponse(generated_text=generated_text)
    except Exception as e:
        logger.exception(f"Error during Gemini API call for /generate/context/{element_type}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

@app.post("/generate/story-branches", response_model=StoryBranchesResponse)
async def generate_story_branches(
    request: GenerateRequest,
    client: genai.Client = Depends(get_gemini_client)
):
    """Generates multiple story branches based on a scenario and branching question."""
    logger.info(f"Received /generate/story-branches request: {request.instruction}")
    
    # Extract scenario and branching question from instruction if possible
    scenario = ""
    question = ""
    
    # Try to extract scenario and question from the instruction
    if "scenario:" in request.instruction.lower() and "question:" in request.instruction.lower():
        parts = request.instruction.split("with branching question:", 1)
        if len(parts) > 1:
            scenario_part = parts[0].replace("Generate 3 distinct story branches for this scenario:", "").strip()
            scenario = scenario_part.strip('"')
            question = parts[1].strip().strip('"')
    
    # Build a specialized prompt for branch generation
    prompt = f"""You are an expert storyteller and creative writing assistant. 
Generate 3 distinct and interesting story branches or paths that could follow from this scenario:

--- Current Scenario ---
{scenario}

--- Branching Question ---
{question}

--- Current Story Context ---
{build_story_context_section(request.story_context)}

For each branch, provide:
1. A clear title that captures the essence of this path
2. A brief summary of what happens in this branch (1-2 sentences)
3. A more detailed continuation of the story following this path (1-2 paragraphs)

Format your response as structured data that can be parsed into separate branches. Make each branch creative, detailed, and distinct from the others."""
    
    logger.debug(f"Constructed Prompt for Story Branches:\n{prompt}")

    # Use slightly higher temperature for creative branching
    branching_config = types.GenerateContentConfig(
        temperature=0.85,
        # max_output_tokens=1024
    )
    
    try:
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt],
            config=branching_config
        )
        
        raw_text = response.text.strip()
        logger.info(f"Gemini response received for story branches. Length: {len(raw_text)}")
        
        # Parse the generated branches into structured data
        branches = parse_story_branches(raw_text)
        logger.info(f"Parsed {len(branches)} branches from response")
        
        return StoryBranchesResponse(branches=branches)
    except Exception as e:
        logger.exception("Error during Gemini API call for /generate/story-branches")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

# --- Helper Functions ---

def build_story_context_section(story_context):
    """Build a formatted string of the story context for prompts."""
    if not story_context:
        return "No additional context provided."
    
    sections = []
    if story_context.genre:
        sections.append(f"Genre: {story_context.genre}")
    if story_context.style:
        sections.append(f"Style: {story_context.style}")
    if story_context.synopsis:
        sections.append(f"Synopsis: {story_context.synopsis}")
    if story_context.characters:
        sections.append(f"Characters: {story_context.characters}")
    if story_context.worldbuilding:
        sections.append(f"Worldbuilding: {story_context.worldbuilding}")
    if story_context.outline:
        sections.append(f"Outline: {story_context.outline}")
    
    return "\n\n".join(sections) if sections else "No additional context provided."

def parse_story_branches(text):
    """Parse the generated text into structured story branches."""
    branches = []
    
    # First try to parse the response as JSON if it looks like JSON
    if text.strip().startswith("[") and text.strip().endswith("]"):
        try:
            import json
            branch_data = json.loads(text)
            if isinstance(branch_data, list):
                for i, branch in enumerate(branch_data):
                    # Map the fields from the JSON format to our expected format
                    branch_id = str(branch.get("branch_id", i+1))
                    branches.append(StoryBranch(
                        id=f"branch-{branch_id}",
                        title=branch.get("title", f"Branch {branch_id}"),
                        summary=branch.get("summary", ""),
                        content=branch.get("continuation", "") or branch.get("content", "")
                    ))
                return branches
        except json.JSONDecodeError:
            # If JSON parsing fails, fall back to text parsing
            logger.warning("Failed to parse branches as JSON, falling back to text parsing")
    
    # If JSON parsing failed or text doesn't look like JSON, use the text parser
    current_branch = None
    current_section = None
    branch_count = 0
    
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        
        # Skip empty lines
        if not line:
            continue
            
        # Look for branch headers (Branch 1, Option 1, Path 1, etc.)
        if re.search(r'^(Branch|Option|Path|Choice|Alternative)\s*[0-9]', line, re.IGNORECASE):
            # Save previous branch if it exists
            if current_branch and 'title' in current_branch and 'content' in current_branch:
                branch_count += 1
                branches.append(StoryBranch(
                    id=f"branch-{branch_count}",
                    title=current_branch.get('title', f"Branch {branch_count}"),
                    summary=current_branch.get('summary', ""),
                    content=current_branch.get('content', "")
                ))
            
            # Start a new branch
            current_branch = {}
            current_section = 'title'
            # Extract just the title part after "Branch X:" if present
            title_match = re.search(r'^(?:Branch|Option|Path|Choice|Alternative)\s*[0-9]:?\s*(.*)', line, re.IGNORECASE)
            if title_match:
                current_branch['title'] = title_match.group(1).strip()
            else:
                current_branch['title'] = line
            continue
            
        # Look for section headers
        if current_branch:
            if re.search(r'^title:', line, re.IGNORECASE):
                current_section = 'title'
                current_branch['title'] = line.split(':', 1)[1].strip() if ':' in line else ""
                continue
            elif re.search(r'^summary:', line, re.IGNORECASE):
                current_section = 'summary'
                current_branch['summary'] = line.split(':', 1)[1].strip() if ':' in line else ""
                continue
            elif re.search(r'^content:|^description:|^continuation:', line, re.IGNORECASE):
                current_section = 'content'
                current_branch['content'] = line.split(':', 1)[1].strip() if ':' in line else ""
                continue
            
            # Add content to the current section
            if current_section:
                current_branch[current_section] = current_branch.get(current_section, "") + " " + line
    
    # Add the last branch if there is one
    if current_branch and 'title' in current_branch and 'content' in current_branch:
        branch_count += 1
        branches.append(StoryBranch(
            id=f"branch-{branch_count}",
            title=current_branch.get('title', f"Branch {branch_count}"),
            summary=current_branch.get('summary', ""),
            content=current_branch.get('content', "")
        ))
    
    # If we didn't successfully parse any branches, create three generic ones
    if not branches:
        # Create three generic branches from the full text
        summary_length = min(100, len(text) // 3)
        for i in range(3):
            branches.append(StoryBranch(
                id=f"branch-{i+1}",
                title=f"Story Path {i+1}",
                summary=text[:summary_length] + "...",
                content=text
            ))
    
    return branches

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