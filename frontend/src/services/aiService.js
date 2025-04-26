const API_BASE_URL = "http://localhost:8000"; // Your backend URL

/**
 * Helper function to make API requests.
 * @param {string} endpoint The API endpoint (e.g., "/generate/write").
 * @param {object} body The request body.
 * @returns {Promise<object>} The JSON response from the API.
 */
async function fetchFromApi(endpoint, body) {
	try {
		const response = await fetch(`${API_BASE_URL}${endpoint}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body),
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({})); // Try to parse error details
			throw new Error(
				`API request failed with status ${response.status}: ${
					errorData.detail || response.statusText
				}`
			);
		}

		return await response.json();
	} catch (error) {
		console.error(`Error calling API endpoint ${endpoint}:`, error);
		throw error; // Re-throw the error to be handled by the caller
	}
}

/**
 * Calls the /generate/write endpoint.
 * @param {object} payload - Contains instruction, current_text, selection, story_context.
 * @returns {Promise<string>} The generated text.
 */
export async function generateWrite(payload) {
	const response = await fetchFromApi("/generate/write", payload);
	return response.generated_text;
}

/**
 * Calls the /generate/rewrite endpoint.
 * @param {object} payload - Contains instruction, current_text, selection, story_context.
 * @returns {Promise<string>} The generated text.
 */
export async function generateRewrite(payload) {
	if (!payload.selection) {
		throw new Error("Selection is required for rewrite operation.");
	}
	// Add a default instruction if none is provided for simplicity
	const body = {
		instruction: "Rewrite the following text",
		...payload,
	};
	const response = await fetchFromApi("/generate/rewrite", body);
	return response.generated_text;
}

/**
 * Calls the /generate/describe endpoint.
 * @param {object} payload - Contains instruction, current_text, selection, story_context.
 * @returns {Promise<string>} The generated text.
 */
export async function generateDescribe(payload) {
	// Add a default instruction if none is provided for simplicity
	const body = {
		instruction: "Describe the following text/concept in more detail",
		...payload,
	};
	const response = await fetchFromApi("/generate/describe", body);
	return response.generated_text;
}

/**
 * Calls the /generate/brainstorm endpoint.
 * @param {object} payload - Contains instruction, current_text, selection, story_context.
 * @returns {Promise<string>} The generated text.
 */
export async function generateBrainstorm(payload) {
	// Add a default instruction if none is provided for simplicity
	const body = {
		instruction: "Brainstorm ideas based on the following",
		...payload,
	};
	const response = await fetchFromApi("/generate/brainstorm", body);
	return response.generated_text;
}

/**
 * Calls the /generate/context/{element_type} endpoint to generate context elements.
 * @param {string} elementType - Type of context element (characters, genre, style, etc.)
 * @param {object} payload - Contains instruction, current_text, story_context.
 * @returns {Promise<string>} The generated text.
 */
export async function generateContextElement(elementType, payload) {
	// Set a default instruction if none is provided
	const body = {
		instruction: `Generate ${elementType} for my story`,
		...payload,
	};
	const response = await fetchFromApi(
		`/generate/context/${elementType}`,
		body
	);
	return response.generated_text;
}

/**
 * Calls the /generate/story-branches endpoint to generate alternative story branches.
 * @param {object} payload - Contains instruction, current_text, story_context.
 * @returns {Promise<Array>} Array of generated story branches.
 */
export async function generateStoryBranches(payload) {
	// Add a default instruction if none is provided for simplicity
	const body = {
		instruction: "Generate alternative story branches",
		...payload,
	};
	const response = await fetchFromApi("/generate/story-branches", body);

	// Ensure we have proper branch objects with correct field names
	try {
		if (response.branches) {
			// Map backend field names to frontend expected field names
			return response.branches.map((branch) => ({
				id:
					branch.id ||
					`branch-${Math.random().toString(36).substr(2, 9)}`,
				title: branch.title || "Untitled Branch",
				summary: branch.summary || "",
				content: branch.content || "",
			}));
		} else {
			console.warn("No branches found in the response:", response);
			return [];
		}
	} catch (err) {
		console.error("Error parsing branches response:", err);
		throw new Error("Failed to parse story branches response");
	}
}

// Export element-specific helper functions for better developer experience
export const generateCharacters = (payload) =>
	generateContextElement("characters", payload);
export const generateGenre = (payload) =>
	generateContextElement("genre", payload);
export const generateStyle = (payload) =>
	generateContextElement("style", payload);
export const generateWorldbuilding = (payload) =>
	generateContextElement("worldbuilding", payload);
export const generateSynopsis = (payload) =>
	generateContextElement("synopsis", payload);
export const generateOutline = (payload) =>
	generateContextElement("outline", payload);
