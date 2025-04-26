import { useState, useEffect } from "react";
import { X, Lightbulb, RefreshCcw } from "lucide-react";
import { generateBrainstorm } from "../services/aiService";

const BRAINSTORM_CATEGORIES = [
	{ id: "dialogue", name: "DIALOGUE", icon: "💬" },
	{ id: "characters", name: "CHARACTERS", icon: "👥" },
	{ id: "worldbuilding", name: "WORLD BUILDING", icon: "🏰" },
	{ id: "plotpoints", name: "PLOT POINTS", icon: "📝" },
	{ id: "names", name: "NAMES", icon: "👤" },
	{ id: "places", name: "PLACES", icon: "🗺️" },
	{ id: "objects", name: "OBJECTS", icon: "🔍" },
	{ id: "descriptions", name: "DESCRIPTIONS", icon: "📖" },
	{ id: "articleideas", name: "ARTICLE IDEAS", icon: "📰" },
	{ id: "tweets", name: "TWEETS", icon: "🐦" },
	{ id: "custom", name: "SOMETHING ELSE", icon: "✨" },
];

export default function BrainstormDialog({
	isOpen,
	onClose,
	editorContent,
	storyContext,
	onBrainstormGenerated,
}) {
	const [isFirstStep, setIsFirstStep] = useState(true);
	const [selectedCategory, setSelectedCategory] = useState(null);
	const [ideaPrompt, setIdeaPrompt] = useState("");
	const [context, setContext] = useState("");
	const [examples, setExamples] = useState([""]);
	const [isGenerating, setIsGenerating] = useState(false);

	// Reset dialog state when opened
	useEffect(() => {
		if (isOpen) {
			setIsFirstStep(true);
			setSelectedCategory(null);
			setIdeaPrompt("");
			setContext("");
			setExamples([""]);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const handleCategorySelect = (category) => {
		setSelectedCategory(category);
		setIsFirstStep(false);

		// Set a default idea prompt based on category
		switch (category.id) {
			case "dialogue":
				setIdeaPrompt("dialogue lines for my characters");
				break;
			case "characters":
				setIdeaPrompt("character ideas for my story");
				break;
			case "worldbuilding":
				setIdeaPrompt("worldbuilding elements for my story");
				break;
			case "plotpoints":
				setIdeaPrompt("plot points for my story");
				break;
			case "names":
				setIdeaPrompt("character names for my story");
				break;
			case "places":
				setIdeaPrompt("location ideas for my story");
				break;
			case "objects":
				setIdeaPrompt("important objects for my story");
				break;
			case "descriptions":
				setIdeaPrompt("descriptive passages for my story");
				break;
			case "articleideas":
				setIdeaPrompt("article ideas related to my topics");
				break;
			case "tweets":
				setIdeaPrompt("tweet-sized story ideas");
				break;
			default:
				setIdeaPrompt("");
		}
	};

	const handleAddExample = () => {
		setExamples([...examples, ""]);
	};

	const handleExampleChange = (index, value) => {
		const newExamples = [...examples];
		newExamples[index] = value;
		setExamples(newExamples);
	};

	const handleStartBrainstorming = async () => {
		if (!ideaPrompt.trim()) {
			return;
		}

		setIsGenerating(true);

		try {
			// Format examples if any are provided
			const formattedExamples = examples
				.filter((ex) => ex.trim().length > 0)
				.join("\n- ");

			const examplesText = formattedExamples
				? `\nExamples:\n- ${formattedExamples}`
				: "";

			// Prepare the payload
			const payload = {
				instruction: `Brainstorm a list of: ${ideaPrompt}${examplesText}`,
				current_text: editorContent,
				story_context: storyContext,
			};

			// Add context if provided
			if (context.trim()) {
				payload.instruction += `\nContext: ${context.trim()}`;
			}

			// Call the generateBrainstorm API
			const result = await generateBrainstorm(payload);

			// Call the callback with the result
			if (onBrainstormGenerated) {
				onBrainstormGenerated(result);
			}

			// Close the dialog
			onClose();
		} catch (error) {
			console.error("Error during brainstorming:", error);
			setIsGenerating(false);
		}
	};

	const handleBack = () => {
		setIsFirstStep(true);
		setSelectedCategory(null);
	};

	return (
		<div className="fixed inset-0 bg-gradient-to-br from-pink-300/90 via-purple-400/90 to-teal-400/90 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-xl w-11/12 max-w-3xl max-h-[90vh] flex flex-col">
				{/* Header */}
				<div className="flex justify-between items-center p-4 border-b">
					<button
						onClick={handleBack}
						className="p-2"
						disabled={isFirstStep}
					>
						{!isFirstStep && (
							<svg
								width="24"
								height="24"
								viewBox="0 0 24 24"
								fill="none"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M15 18L9 12L15 6"
									stroke="#000000"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								/>
							</svg>
						)}
					</button>
					<h2 className="text-xl font-bold">
						{isFirstStep
							? "What do you want to brainstorm?"
							: "Kickstart your Brainstorm"}
					</h2>
					<button onClick={onClose} className="p-2">
						<X size={24} />
					</button>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-auto p-4">
					{isFirstStep ? (
						// Category selection grid
						<div className="grid grid-cols-3 gap-4">
							{BRAINSTORM_CATEGORIES.map((category) => (
								<div
									key={category.id}
									className="bg-white rounded-lg shadow border p-6 flex flex-col items-center gap-2 hover:shadow-md cursor-pointer"
									onClick={() =>
										handleCategorySelect(category)
									}
								>
									<div className="text-3xl">
										{category.icon}
									</div>
									<div className="text-center font-medium">
										{category.name}
									</div>
								</div>
							))}
						</div>
					) : (
						// Brainstorm configuration form
						<div className="space-y-6 pb-4">
							{/* Pro tip section */}
							<div className="bg-gray-900 text-white p-4 rounded-lg">
								<div className="flex items-start gap-3">
									<Lightbulb className="text-yellow-400 mt-1" />
									<div>
										<p className="font-semibold text-lg mb-2">
											Pro Tip
										</p>
										<p>
											Brainstorm can make lists of
											anything! Like features for an app,
											headlines for an article, or plot
											points in a mystery thriller.
										</p>
									</div>
								</div>
								<button className="bg-gray-200 text-gray-800 w-full rounded py-2 mt-4 font-medium">
									Gotcha
								</button>
							</div>

							{/* Idea prompt */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Give me a list of:
								</label>
								<input
									value={ideaPrompt}
									onChange={(e) =>
										setIdeaPrompt(e.target.value)
									}
									className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
									placeholder="What kind of ideas are you looking for?"
								/>
								<button className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400">
									<RefreshCcw size={18} />
								</button>
							</div>

							{/* Context (optional) */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Context (optional)
								</label>
								<textarea
									value={context}
									onChange={(e) => setContext(e.target.value)}
									className="w-full p-3 border rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-pink-500"
									placeholder="Add any relevant context..."
								/>
							</div>

							{/* Examples (optional) */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Examples (optional)
								</label>
								{examples.map((example, index) => (
									<textarea
										key={index}
										value={example}
										onChange={(e) =>
											handleExampleChange(
												index,
												e.target.value
											)
										}
										className="w-full p-3 border rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
										placeholder="Add example ideas..."
									/>
								))}
								<button
									onClick={handleAddExample}
									className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50"
								>
									+ Add Another
								</button>
							</div>
						</div>
					)}
				</div>

				{/* Footer */}
				{!isFirstStep && (
					<div className="border-t p-4 flex justify-end">
						<button
							onClick={handleStartBrainstorming}
							disabled={!ideaPrompt.trim() || isGenerating}
							className={`px-6 py-2 rounded-lg bg-gray-900 text-white font-medium ${
								!ideaPrompt.trim() || isGenerating
									? "opacity-50 cursor-not-allowed"
									: ""
							}`}
						>
							{isGenerating ? "Generating..." : "Start"}
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
