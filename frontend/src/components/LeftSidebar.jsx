import {
	Brain,
	Download,
	FileText,
	Italic,
	Layout,
	List,
	MessageSquare,
	Plus,
	Trash2,
	Type,
	Copy,
	Check,
	Loader,
	UserPlus,
} from "lucide-react";
import { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import {
	generateCharacters,
	generateGenre,
	generateStyle,
	generateWorldbuilding,
	generateSynopsis,
	generateOutline,
} from "../services/aiService";
import { marked } from "marked";

export default function LeftSidebar({
	isStoryBibleEnabled,
	setIsStoryBibleEnabled,
	storyContext,
	setStoryContext,
	editorContent,
}) {
	const [activeItem, setActiveItem] = useState(null);
	const [generatorPrompt, setGeneratorPrompt] = useState("");
	const [generatedContent, setGeneratedContent] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState(null);
	const [addedItems, setAddedItems] = useState({});

	// For character parsing
	const [parsedCharacters, setParsedCharacters] = useState([]);

	const handleItemClick = (item) => {
		setActiveItem(activeItem === item ? null : item);
		setGeneratorPrompt("");
		setGeneratedContent("");
		setParsedCharacters([]);
		setError(null);
		setAddedItems({});
	};

	// Parse generated markdown to extract individual characters
	const parseCharacters = useCallback(
		(markdown) => {
			if (activeItem !== "Characters") return;

			try {
				// Simple parser to find character blocks based on headings
				const characters = [];
				let currentCharacter = null;

				const lines = markdown.split("\n");

				for (let i = 0; i < lines.length; i++) {
					const line = lines[i];

					// Check if this is a heading that starts a new character
					if (line.startsWith("# ") || line.startsWith("## ")) {
						// If we were parsing a character, save it
						if (currentCharacter) {
							characters.push(currentCharacter);
						}

						// Start a new character
						currentCharacter = {
							name: line.replace(/^#+ /, "").trim(),
							content: line + "\n",
						};
					} else if (currentCharacter) {
						// Add line to current character content
						currentCharacter.content += line + "\n";
					}
				}

				// Don't forget to add the last character
				if (currentCharacter) {
					characters.push(currentCharacter);
				}

				return characters.length > 0
					? characters
					: [
							{
								name: "Character",
								content: markdown,
							},
					  ];
			} catch (err) {
				console.error("Failed to parse characters:", err);
				return [
					{
						name: "Character",
						content: markdown,
					},
				];
			}
		},
		[activeItem]
	);

	const handleGenerate = async (elementType) => {
		if (!generatorPrompt.trim()) {
			setError("Please enter a prompt to guide the generation.");
			return;
		}

		setIsGenerating(true);
		setError(null);
		setAddedItems({});

		try {
			let generatedText = "";
			const payload = {
				instruction: generatorPrompt,
				current_text: editorContent,
				story_context: storyContext,
			};

			switch (elementType) {
				case "Characters":
					generatedText = await generateCharacters(payload);
					// Parse characters for individual adding
					const characters = parseCharacters(generatedText);
					setParsedCharacters(characters);
					break;
				case "Genre":
					generatedText = await generateGenre(payload);
					break;
				case "Style":
					generatedText = await generateStyle(payload);
					break;
				case "Worldbuilding":
					generatedText = await generateWorldbuilding(payload);
					break;
				case "Synopsis":
					generatedText = await generateSynopsis(payload);
					break;
				case "Outline":
					generatedText = await generateOutline(payload);
					break;
				case "Braindump":
					generatedText = await generateCharacters({
						...payload,
						instruction: `Free-form brainstorm about the story, focusing on: ${generatorPrompt}`,
					});
					break;
				default:
					setError(`Unsupported element type: ${elementType}`);
					return;
			}

			setGeneratedContent(generatedText);
		} catch (err) {
			console.error("Generation failed:", err);
			setError(err.message || "Failed to generate content.");
			setParsedCharacters([]);
		} finally {
			setIsGenerating(false);
		}
	};

	// Add a single character to context
	const addCharacterToContext = (character, index) => {
		if (!character || !character.content) return;

		setStoryContext((prevContext) => ({
			...prevContext,
			characters: prevContext.characters
				? `${prevContext.characters}\n\n${character.content}`
				: character.content,
		}));

		// Mark this character as added
		setAddedItems((prev) => ({
			...prev,
			[`character-${index}`]: true,
		}));

		setTimeout(() => {
			setAddedItems((prev) => ({
				...prev,
				[`character-${index}`]: false,
			}));
		}, 2000);
	};

	// Add generic content to context (for non-character items)
	const addToContext = (elementType) => {
		if (!generatedContent) return;

		const contextFieldMap = {
			Genre: "genre",
			Style: "style",
			Worldbuilding: "worldbuilding",
			Synopsis: "synopsis",
			Outline: "outline",
			Braindump: "characters",
		};

		const contextField = contextFieldMap[elementType];
		if (!contextField) return;

		setStoryContext((prevContext) => ({
			...prevContext,
			[contextField]: prevContext[contextField]
				? `${prevContext[contextField]}\n\n${generatedContent}`
				: generatedContent,
		}));

		setAddedItems((prev) => ({
			...prev,
			[elementType.toLowerCase()]: true,
		}));

		setTimeout(() => {
			setAddedItems((prev) => ({
				...prev,
				[elementType.toLowerCase()]: false,
			}));
		}, 2000);
	};

	return (
		<div className="w-64 border-r border-gray-200 p-4 flex flex-col bg-white lg:block md:w-52 sm:hidden h-full overflow-y-auto">
			<div className="flex gap-2 mb-4">
				<SidebarButton icon={<Plus size={16} />} label="New" />
				<SidebarButton icon={<Download size={16} />} label="Import" />
			</div>

			<div className="mb-6">
				<SidebarItem icon={<FileText size={16} />} label="Untitled" />
				<SidebarItem
					icon={<FileText size={16} />}
					label="Untitled 2"
					active={true}
				/>
			</div>

			<StoryBibleSection
				isStoryBibleEnabled={isStoryBibleEnabled}
				setIsStoryBibleEnabled={setIsStoryBibleEnabled}
				activeItem={activeItem}
				onItemClick={handleItemClick}
				generatorPrompt={generatorPrompt}
				setGeneratorPrompt={setGeneratorPrompt}
				generatedContent={generatedContent}
				parsedCharacters={parsedCharacters}
				isGenerating={isGenerating}
				error={error}
				handleGenerate={handleGenerate}
				addToContext={addToContext}
				addCharacterToContext={addCharacterToContext}
				addedItems={addedItems}
			/>

			<div className="mt-auto">
				<SidebarButton icon={<Trash2 size={16} />} label="Trash" />
			</div>
		</div>
	);
}

function StoryBibleSection({
	isStoryBibleEnabled,
	setIsStoryBibleEnabled,
	activeItem,
	onItemClick,
	generatorPrompt,
	setGeneratorPrompt,
	generatedContent,
	parsedCharacters,
	isGenerating,
	error,
	handleGenerate,
	addToContext,
	addCharacterToContext,
	addedItems,
}) {
	const items = [
		{ label: "Braindump", icon: <Brain size={16} /> },
		{ label: "Genre", icon: <Type size={16} /> },
		{ label: "Style", icon: <Italic size={16} /> },
		{ label: "Synopsis", icon: <FileText size={16} /> },
		{ label: "Characters", icon: <MessageSquare size={16} /> },
		{ label: "Worldbuilding", icon: <Layout size={16} /> },
		{ label: "Outline", icon: <List size={16} /> },
	];

	return (
		<div className="mt-4 overflow-auto flex-1">
			<div className="flex justify-between items-center mb-3">
				<div className="flex items-center gap-2">
					<FileText size={16} className="text-pink-400" />
					<span className="text-pink-400 font-medium">
						Story Bible
					</span>
				</div>
				<label className="relative inline-block w-9 h-5">
					<input
						type="checkbox"
						className="opacity-0 w-0 h-0"
						checked={isStoryBibleEnabled}
						onChange={() =>
							setIsStoryBibleEnabled(!isStoryBibleEnabled)
						}
					/>
					<span
						className={`absolute cursor-pointer inset-0 bg-gray-300 rounded-full before:absolute before:h-4 before:w-4 before:left-0.5 before:bottom-0.5 before:bg-white before:rounded-full before:transition-transform ${
							isStoryBibleEnabled
								? "before:translate-x-4 bg-pink-400"
								: ""
						}`}
					></span>
				</label>
			</div>

			<div className="ml-3">
				{items.map((item) => (
					<div key={item.label}>
						<div
							className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
								activeItem === item.label
									? "text-pink-600 bg-pink-50"
									: "text-gray-600 hover:bg-gray-100"
							}`}
							onClick={() => onItemClick(item.label)}
						>
							{item.icon}
							<span>{item.label}</span>
						</div>

						{activeItem === item.label && (
							<div className="ml-3 mt-2 mb-4">
								<div className="text-sm text-gray-700 font-medium mb-1">{`Generate ${item.label}`}</div>
								<div className="mb-3">
									<textarea
										className="w-full p-2 border rounded text-sm resize-none"
										value={generatorPrompt}
										onChange={(e) =>
											setGeneratorPrompt(e.target.value)
										}
										placeholder={`Enter ideas for ${item.label.toLowerCase()}...`}
										rows={3}
									/>
								</div>
								<button
									className="w-full mb-4 py-1.5 px-4 bg-pink-500 text-white rounded text-sm hover:bg-pink-600 flex justify-center items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
									onClick={() => handleGenerate(item.label)}
									disabled={
										isGenerating || !generatorPrompt.trim()
									}
								>
									{isGenerating ? (
										<>
											<Loader
												size={14}
												className="animate-spin"
											/>
											<span>Generating...</span>
										</>
									) : (
										<span>Generate</span>
									)}
								</button>

								{error && (
									<div className="text-red-500 text-xs mb-2">
										{error}
									</div>
								)}

								{/* Special case for Characters with individual add buttons */}
								{item.label === "Characters" &&
								parsedCharacters.length > 0 ? (
									<div className="space-y-4">
										{parsedCharacters.map(
											(character, index) => (
												<div
													key={`character-${index}`}
													className="border rounded bg-white overflow-hidden"
												>
													<div className="bg-pink-50 px-3 py-1.5 border-b flex justify-between items-center">
														<span className="font-medium text-sm">
															{character.name}
														</span>
														<button
															className={`flex items-center gap-1 text-xs ${
																addedItems[
																	`character-${index}`
																]
																	? "bg-green-100 text-green-800"
																	: "bg-pink-100 hover:bg-pink-200 text-pink-800"
															} px-2 py-1 rounded`}
															onClick={() =>
																addCharacterToContext(
																	character,
																	index
																)
															}
														>
															{addedItems[
																`character-${index}`
															] ? (
																<>
																	<Check
																		size={
																			12
																		}
																	/>
																	<span>
																		Added!
																	</span>
																</>
															) : (
																<>
																	<UserPlus
																		size={
																			12
																		}
																	/>
																	<span>
																		Add
																	</span>
																</>
															)}
														</button>
													</div>
													<div className="p-3 text-sm max-h-52 overflow-auto">
														<ReactMarkdown>
															{character.content}
														</ReactMarkdown>
													</div>
												</div>
											)
										)}
									</div>
								) : (
									generatedContent && (
										// For other content types (non-character)
										<div className="border rounded bg-white overflow-hidden">
											<div className="p-3 max-h-80 overflow-auto">
												<div className="markdown prose prose-sm prose-pink max-w-none">
													<ReactMarkdown>
														{generatedContent}
													</ReactMarkdown>
												</div>
											</div>
											<div className="bg-gray-50 px-3 py-2 border-t flex justify-end">
												<button
													className={`flex items-center gap-1 text-xs ${
														addedItems[
															item.label.toLowerCase()
														]
															? "bg-green-100 text-green-800"
															: "bg-pink-100 hover:bg-pink-200 text-pink-800"
													} px-2 py-1 rounded`}
													onClick={() =>
														addToContext(item.label)
													}
												>
													{addedItems[
														item.label.toLowerCase()
													] ? (
														<>
															<Check size={12} />
															<span>Added!</span>
														</>
													) : (
														<>
															<Plus size={12} />
															<span>
																Add to Context
															</span>
														</>
													)}
												</button>
											</div>
										</div>
									)
								)}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}

function SidebarItem({ icon, label, active, onClick }) {
	return (
		<div
			className={`flex items-center gap-2 p-2 rounded ${
				active
					? "text-blue-600 bg-blue-50"
					: "text-gray-600 hover:bg-gray-100"
			}`}
			onClick={onClick}
		>
			{icon}
			<span>{label}</span>
		</div>
	);
}

function SidebarButton({ icon, label }) {
	return (
		<button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 border border-gray-200 rounded text-sm">
			{icon}
			<span>{label}</span>
		</button>
	);
}
