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
