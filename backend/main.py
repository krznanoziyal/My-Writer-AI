# main.py
from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
from google import genai
import json
from datetime import datetime

# Initialize FastAPI app
app = FastAPI(title="StoryAssist Backend API")

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client
# In production, use environment variables for API keys
API_KEY = os.environ.get("GEMINI_API_KEY", "YOUR_API_KEY_HERE")
genai_client = genai.Client(api_key=API_KEY)
MODEL_NAME = "gemini-2.0-flash"  # Using the specified model

# --- Models ---

class Document(BaseModel):
    id: str
    title: str
    content: str
    last_modified: str
    
class StoryBibleItem(BaseModel):
    id: str
    type: str  # e.g., "braindump", "genre", "characters", etc.
    title: str
    content: str
    
class WritingRequest(BaseModel):
    prompt: str
    document_id: str
    context: Optional[str] = None
    target_audience: Optional[str] = "adults"
    genre: Optional[str] = None
    
class RewriteRequest(BaseModel):
    original_text: str
    instruction: str
    document_id: str
    target_audience: Optional[str] = "adults"
    
class DescribeRequest(BaseModel):
    text: str
    description_type: str  # e.g., "character", "setting", "object"
    document_id: str
    
class BrainstormRequest(BaseModel):
    topic: str
    document_id: str
    genre: Optional[str] = None
    
class StoryBibleRequest(BaseModel):
    category: str  # e.g., "braindump", "genre", "synopsis", etc.
    content: str
    document_id: str

# --- In-memory database (Replace with real DB in production) ---
documents = {}
story_bible = {}

# --- Helper Functions ---

def generate_gemini_response(prompt, system_instruction=None):
    """Generate content using Gemini API with optional system instruction"""
    try:
        config = {}
        if system_instruction:
            config = {"system_instruction": system_instruction}
            
        response = genai_client.models.generate_content(
            model=MODEL_NAME,
            contents=[prompt],
            config=config
        )
        return response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

def get_writing_prompt(request, document_content=""):
    """Create a detailed prompt for the write functionality"""
    system_instruction = f"""
    You are a professional creative writing assistant. Your task is to generate high-quality story content 
    that matches the user's genre and is appropriate for {request.target_audience} readers.
    Use vocabulary and themes appropriate for this audience. Be descriptive and engaging while maintaining 
    narrative coherence with the existing content. Follow modern writing practices from bestselling authors.
    """
    
    prompt = f"""
    Based on the following context, continue the story or create new content as requested.
    
    EXISTING CONTENT:
    {document_content}
    
    USER REQUEST:
    {request.prompt}
    
    GENRE: {request.genre if request.genre else "Not specified"}
    TARGET AUDIENCE: {request.target_audience}
    
    Please generate high-quality, coherent story content that flows naturally from the existing text.
    """
    
    return prompt, system_instruction

# --- API Endpoints ---

@app.get("/")
async def root():
    return {"message": "StoryAssist Backend API is running"}

# Document Management Endpoints
@app.post("/documents/", response_model=Document)
async def create_document():
    doc_id = f"doc_{len(documents) + 1}"
    timestamp = datetime.now().isoformat()
    new_doc = {
        "id": doc_id,
        "title": f"Untitled {len(documents) + 1}",
        "content": "",
        "last_modified": timestamp
    }
    documents[doc_id] = new_doc
    return new_doc

@app.get("/documents/", response_model=List[Document])
async def get_documents():
    return list(documents.values())

@app.get("/documents/{doc_id}", response_model=Document)
async def get_document(doc_id: str):
    if doc_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    return documents[doc_id]

@app.put("/documents/{doc_id}", response_model=Document)
async def update_document(doc_id: str, content: str = Body(..., embed=True), title: Optional[str] = None):
    if doc_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if title:
        documents[doc_id]["title"] = title
    
    documents[doc_id]["content"] = content
    documents[doc_id]["last_modified"] = datetime.now().isoformat()
    
    return documents[doc_id]

@app.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    if doc_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    del documents[doc_id]
    return {"message": "Document deleted successfully"}

# Writing Assistant Endpoints
@app.post("/write/")
async def write_content(request: WritingRequest):
    if request.document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Get existing document content for context
    document_content = documents[request.document_id]["content"]
    
    # Generate the writing prompt
    prompt, system_instruction = get_writing_prompt(request, document_content)
    
    # Call Gemini API
    generated_content = generate_gemini_response(prompt, system_instruction)
    
    return {"generated_content": generated_content}

@app.post("/rewrite/")
async def rewrite_content(request: RewriteRequest):
    if request.document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    system_instruction = f"""
    You are a professional editor and writer. Your task is to rewrite the provided text according 
    to the user's instructions. Make sure the content is appropriate for {request.target_audience} readers.
    Maintain the essence of the original while improving it as requested.
    """
    
    prompt = f"""
    ORIGINAL TEXT:
    {request.original_text}
    
    REWRITE INSTRUCTIONS:
    {request.instruction}
    
    TARGET AUDIENCE: {request.target_audience}
    
    Please rewrite the text following the instructions while maintaining the core message.
    """
    
    # Call Gemini API
    rewritten_content = generate_gemini_response(prompt, system_instruction)
    
    return {"rewritten_content": rewritten_content}

@app.post("/describe/")
async def describe_content(request: DescribeRequest):
    if request.document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    system_instruction = """
    You are a descriptive writing expert. Your task is to create rich, detailed descriptions 
    that engage the reader's senses and imagination. Focus on showing rather than telling,
    and use vivid, specific language.
    """
    
    prompt = f"""
    Create a detailed description for the following {request.description_type}:
    
    TEXT TO DESCRIBE:
    {request.text}
    
    Please provide a rich, engaging description that would enhance a story.
    """
    
    # Call Gemini API
    description = generate_gemini_response(prompt, system_instruction)
    
    return {"description": description}

@app.post("/brainstorm/")
async def brainstorm_ideas(request: BrainstormRequest):
    if request.document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    system_instruction = """
    You are a creative writing consultant specialized in brainstorming ideas for authors.
    Generate innovative, engaging, and coherent suggestions that could enhance a story.
    Focus on originality while maintaining narrative plausibility.
    """
    
    prompt = f"""
    Brainstorm creative ideas related to the following topic:
    
    TOPIC: {request.topic}
    GENRE: {request.genre if request.genre else "Not specified"}
    
    Please provide a variety of fresh ideas, plot possibilities, character concepts, 
    settings, or narrative twists that could enhance the story.
    """
    
    # Call Gemini API
    brainstorm_results = generate_gemini_response(prompt, system_instruction)
    
    return {"brainstorm_results": brainstorm_results}

# Story Bible Endpoints
@app.post("/story-bible/")
async def create_story_bible_item(request: StoryBibleRequest):
    if request.document_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Define prompts based on category
    prompts = {
        "braindump": "Organize and expand on these initial thoughts for a story:",
        "genre": "Describe the conventions, tropes, and expectations of this genre:",
        "style": "Analyze and suggest improvements for this writing style:",
        "synopsis": "Create a comprehensive synopsis based on this information:",
        "characters": "Develop character profiles based on these descriptions:",
        "worldbuilding": "Create detailed world-building elements based on this information:",
        "outline": "Develop a structured outline based on these story elements:"
    }
    
    system_instruction = """
    You are a story development consultant. Your task is to help authors organize their thoughts 
    and develop comprehensive story elements for their creative projects.
    """
    
    # Check if category is valid
    if request.category not in prompts:
        raise HTTPException(status_code=400, detail="Invalid story bible category")
    
    prompt = f"""
    {prompts[request.category]}
    
    {request.content}
    
    Please provide structured, detailed information that will help develop this story element.
    """
    
    # Call Gemini API
    enhanced_content = generate_gemini_response(prompt, system_instruction)
    
    # Create story bible item
    item_id = f"{request.category}_{request.document_id}"
    story_bible_item = {
        "id": item_id,
        "type": request.category,
        "title": request.category.capitalize(),
        "content": enhanced_content
    }
    
    # Store in memory (or database in production)
    if request.document_id not in story_bible:
        story_bible[request.document_id] = {}
    
    story_bible[request.document_id][request.category] = story_bible_item
    
    return story_bible_item

@app.get("/story-bible/{doc_id}")
async def get_story_bible(doc_id: str):
    if doc_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc_id not in story_bible:
        return []
    
    return list(story_bible[doc_id].values())

@app.get("/story-bible/{doc_id}/{category}")
async def get_story_bible_item(doc_id: str, category: str):
    if doc_id not in documents:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if doc_id not in story_bible or category not in story_bible[doc_id]:
        raise HTTPException(status_code=404, detail=f"Story bible item for category '{category}' not found")
    
    return story_bible[doc_id][category]

# Run with: uvicorn main:app --reload
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)