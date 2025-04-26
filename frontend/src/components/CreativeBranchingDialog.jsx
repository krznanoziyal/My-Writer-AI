import { useState, useEffect } from "react";
import {
	Brain,
	Download,
	FileText,
	GitBranch,
	Plus,
	ChevronRight,
	Check,
	Loader,
	ArrowLeft,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { generateStoryBranches } from "../services/aiService";

export default function CreativeBranchingDialog({
	isOpen,
	onClose,
	editorContent,
	storyContext,
}) {
	const [currentScenario, setCurrentScenario] = useState("initial");
	const [branchHistory, setBranchHistory] = useState([]);
	const [scenarioText, setScenarioText] = useState("");
	const [branchQuestion, setBranchQuestion] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [branches, setBranches] = useState([]);
	const [error, setError] = useState(null);
	const [activeTab, setActiveTab] = useState("editor");
	const [customBranchTitle, setCustomBranchTitle] = useState("");
	const [customBranchContent, setCustomBranchContent] = useState("");

	// Use the editor content as initial scenario if available
	useEffect(() => {
		if (editorContent && !scenarioText && currentScenario === "initial") {
			// Take the last paragraph or a portion of the editor content as the scenario
			const paragraphs = editorContent.split("\n\n");
			const initialScenario =
				paragraphs.length > 0
					? paragraphs[paragraphs.length - 1]
					: editorContent.slice(-300); // Take last 300 chars if no paragraphs

			setScenarioText(initialScenario);
		}
	}, [editorContent, scenarioText, currentScenario]);

	// Handle closing the dialog
	if (!isOpen) return null;

	const handleGenerateBranches = async () => {
		if (!scenarioText.trim()) {
			setError("Please describe the current scenario first.");
			return;
		}

		if (!branchQuestion.trim()) {
			setError("Please enter a branching question.");
			return;
		}

		setIsGenerating(true);
		setError(null);

		try {
			const payload = {
				instruction: `Generate 3 distinct story branches for this scenario: "${scenarioText}" with branching question: "${branchQuestion}"`,
				current_text: `${editorContent}\n\nCurrent scenario: ${scenarioText}`,
				story_context: storyContext,
			};

			const generatedBranches = await generateStoryBranches(payload);
			setBranches(generatedBranches);
		} catch (err) {
			console.error("Failed to generate branches:", err);
			setError(err.message || "Failed to generate story branches.");
		} finally {
			setIsGenerating(false);
		}
	};

	const handleSelectBranch = (branch) => {
		if (!branch || !branch.id) {
			console.error("Invalid branch selected:", branch);
			return;
		}

		setBranchHistory([
			...branchHistory,
			{
				id: currentScenario,
				text: scenarioText,
				question: branchQuestion,
				branches: branches,
			},
		]);
		setCurrentScenario(branch.id);
		setScenarioText(branch.content || "");
		setBranchQuestion("");
		setBranches([]);
		setActiveTab("visualization");
	};

	const handleGoBack = () => {
		if (branchHistory.length > 0) {
			const previousState = branchHistory[branchHistory.length - 1];
			const newHistory = branchHistory.slice(0, -1);

			setCurrentScenario(previousState.id);
			setScenarioText(previousState.text);
			setBranchQuestion(previousState.question);
			setBranches(previousState.branches);
			setBranchHistory(newHistory);
		}
	};

	const handleCustomBranch = () => {
		// Functionality for adding a custom branch
		const customBranchId = `custom-${Date.now()}`;
		if (customBranchTitle.trim() && customBranchContent.trim()) {
			const newBranch = {
				id: customBranchId,
				title: customBranchTitle,
				content: customBranchContent,
				summary:
					customBranchContent.slice(0, 100) +
					(customBranchContent.length > 100 ? "..." : ""),
				isCustom: true,
			};
			setBranches([...branches, newBranch]);
			setCustomBranchTitle("");
			setCustomBranchContent("");
		}
	};

	// Helper to get branch title for visualization
	const getBranchTitle = (historyItem, index) => {
		if (historyItem.branches && historyItem.branches.length > 0) {
			// Find the branch that was followed next (the current branch when this was in history)
			const nextBranchId =
				index < branchHistory.length - 1
					? branchHistory[index + 1].id
					: currentScenario;

			const selectedBranch = historyItem.branches.find(
				(b) => b.id === nextBranchId
			);
			if (selectedBranch) {
				return selectedBranch.title;
			}
		}
		return historyItem.question || `Branch ${index + 1}`;
	};

	// Helper to get the title of the current branch
	const getCurrentBranchTitle = () => {
		if (branchHistory.length > 0) {
			const lastHistory = branchHistory[branchHistory.length - 1];
			const current = lastHistory.branches.find(
				(b) => b.id === currentScenario
			);
			return current ? current.title : "";
		}
		return "";
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] flex flex-col">
				{/* Header */}
				<div className="border-b p-4">
					<h2 className="text-xl font-bold">
						Creative Expansion & Branching
					</h2>
					<p className="text-gray-600">
						Explore different story paths and outcomes in a
						"choose-your-own-adventure" format.
					</p>
				</div>

				{/* Tabs */}
				<div className="flex border-b">
					<button
						className={`px-4 py-2 ${
							activeTab === "editor"
								? "border-b-2 border-pink-500 text-pink-500"
								: "text-gray-600"
						}`}
						onClick={() => setActiveTab("editor")}
					>
						Story Editor
					</button>
					<button
						className={`px-4 py-2 ${
							activeTab === "visualization"
								? "border-b-2 border-pink-500 text-pink-500"
								: "text-gray-600"
						}`}
						onClick={() => setActiveTab("visualization")}
					>
						Path Visualization
					</button>
				</div>

				{/* Content area */}
				<div className="flex-1 overflow-auto p-4">
					{activeTab === "editor" ? (
						<div className="space-y-4">
							{/* Back button */}
							<div className="flex items-center space-x-2 mb-4">
								<button
									className={`px-3 py-1.5 border rounded text-sm flex items-center gap-1.5 ${
										branchHistory.length > 0
											? "hover:bg-gray-100"
											: "opacity-50 cursor-not-allowed"
									}`}
									onClick={handleGoBack}
									disabled={branchHistory.length === 0}
								>
									<ArrowLeft size={14} />
									<span>Back to Previous</span>
								</button>
								<div className="text-sm text-gray-500">
									{branchHistory.length > 0
										? `${branchHistory.length} branches explored`
										: "Start exploring branches"}
								</div>
							</div>

							{/* Current scenario */}
							<div className="space-y-2">
								<label className="block text-sm font-medium text-gray-700">
									Current Scenario
								</label>
								<textarea
									className="w-full p-2 border rounded focus:border-pink-500 focus:ring focus:ring-pink-200 resize-none"
									placeholder="Describe the current scenario in your story"
									value={scenarioText}
									onChange={(e) =>
										setScenarioText(e.target.value)
									}
									rows={5}
								/>
							</div>

							{/* Branching question */}
							<div className="space-y-2">
								<label className="block text-sm font-medium text-gray-700">
									Branching Question
								</label>
								<input
									className="w-full p-2 border rounded focus:border-pink-500 focus:ring focus:ring-pink-200"
									placeholder="What decision point are you exploring?"
									value={branchQuestion}
									onChange={(e) =>
										setBranchQuestion(e.target.value)
									}
								/>
							</div>

							{/* Generate button */}
							<button
								className="w-full py-2 bg-pink-500 text-white rounded hover:bg-pink-600 flex justify-center items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
								onClick={handleGenerateBranches}
								disabled={
									isGenerating ||
									!scenarioText.trim() ||
									!branchQuestion.trim()
								}
							>
								{isGenerating ? (
									<>
										<Loader
											size={16}
											className="animate-spin"
										/>
										<span>Generating Branches...</span>
									</>
								) : (
									<span>Generate Story Branches</span>
								)}
							</button>

							{/* Error message */}
							{error && (
								<div className="text-red-500 text-sm">
									{error}
								</div>
							)}

							{/* Generated branches */}
							{!isGenerating && branches.length > 0 && (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
									{branches.map((branch) => (
										<div
											key={branch.id}
											className="border rounded overflow-hidden"
										>
											<div className="bg-gray-50 p-3 border-b">
												<div className="font-medium flex items-center">
													<GitBranch
														size={16}
														className="mr-2"
													/>
													{branch.title}
												</div>
											</div>
											<div className="p-3">
												<p className="text-sm">
													{branch.summary}
												</p>
											</div>
											<div className="bg-gray-50 p-3 border-t flex justify-end">
												<button
													className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-pink-100 text-pink-800 rounded hover:bg-pink-200"
													onClick={() =>
														handleSelectBranch(
															branch
														)
													}
												>
													Explore this path
													<ChevronRight size={14} />
												</button>
											</div>
										</div>
									))}

									{/* Custom branch card */}
									<div className="border rounded overflow-hidden">
										<div className="bg-gray-50 p-3 border-b">
											<div className="font-medium flex items-center">
												<Plus
													size={16}
													className="mr-2"
												/>
												Create Custom Branch
											</div>
										</div>
										<div className="p-3 space-y-2">
											<input
												className="w-full p-2 border rounded text-sm"
												placeholder="Enter your custom branch title"
												value={customBranchTitle}
												onChange={(e) =>
													setCustomBranchTitle(
														e.target.value
													)
												}
											/>
											<textarea
												className="w-full p-2 border rounded text-sm resize-none"
												placeholder="Describe what happens in this branch"
												value={customBranchContent}
												onChange={(e) =>
													setCustomBranchContent(
														e.target.value
													)
												}
												rows={3}
											/>
										</div>
										<div className="bg-gray-50 p-3 border-t">
											<button
												className="w-full py-1.5 border rounded text-sm hover:bg-gray-100"
												onClick={handleCustomBranch}
											>
												Add Custom Branch
											</button>
										</div>
									</div>
								</div>
							)}
						</div>
					) : (
						<div className="space-y-6">
							{/* Visualization tab content */}
							<div className="bg-gray-50 border rounded p-6 min-h-[500px] relative">
								<h3 className="text-lg font-medium mb-4">
									Story Branching Map
								</h3>

								{/* Simple tree visualization - can be enhanced later */}
								<div className="flex flex-col items-center">
									{/* Root node */}
									<div
										className={`p-3 rounded-lg border-2 ${
											currentScenario === "initial"
												? "border-pink-500 bg-pink-50"
												: "border-gray-300"
										} mb-4 w-64 text-center`}
									>
										<p className="font-medium">
											Initial Scenario
										</p>
										<p className="text-xs text-gray-600">
											Starting point
										</p>
									</div>

									{/* Only show branch connections if there's history */}
									{branchHistory.length > 0 && (
										<>
											<div className="h-8 w-0.5 bg-gray-400"></div>
											<div className="flex justify-center space-x-4 mb-4 flex-wrap">
												{/* Branch visualization with proper titles */}
												{branchHistory.map(
													(historyItem, index) => (
														<div
															key={
																historyItem.id ||
																index
															}
															className="flex flex-col items-center mb-4"
														>
															<div
																className={`p-3 rounded-lg border-2 
																${
																	index ===
																		branchHistory.length -
																			1 &&
																	currentScenario !==
																		"initial"
																		? "border-pink-500 bg-pink-50"
																		: "border-gray-300"
																} 
																w-48 text-center`}
															>
																<p className="font-medium">
																	{getBranchTitle(
																		historyItem,
																		index
																	)}
																</p>
																<p className="text-xs text-gray-600 truncate">
																	{
																		historyItem.question
																	}
																</p>
															</div>
															{index <
																branchHistory.length -
																	1 && (
																<div className="h-8 w-0.5 bg-gray-400"></div>
															)}
														</div>
													)
												)}
											</div>
										</>
									)}

									{/* Current node if not initial */}
									{currentScenario !== "initial" &&
										branchHistory.length > 0 && (
											<>
												<div className="h-8 w-0.5 bg-gray-400"></div>
												<div className="p-3 rounded-lg border-2 border-pink-500 bg-pink-50 mb-4 w-64 text-center">
													<p className="font-medium">
														{getCurrentBranchTitle() ||
															"Current Path"}
													</p>
													<p className="text-xs text-gray-600 truncate">
														{scenarioText.slice(
															0,
															50
														) +
															(scenarioText.length >
															50
																? "..."
																: "")}
													</p>
												</div>
											</>
										)}
								</div>

								{/* Legend */}
								<div className="absolute bottom-4 right-4 bg-white p-3 rounded border text-sm">
									<div className="flex items-center mb-2">
										<div className="w-4 h-4 rounded border-2 border-pink-500 bg-pink-50 mr-2"></div>
										<span>Current Path</span>
									</div>
									<div className="flex items-center">
										<div className="w-4 h-4 rounded border-2 border-gray-300 mr-2"></div>
										<span>Explored Path</span>
									</div>
								</div>
							</div>

							{/* Statistics */}
							<div className="space-y-4">
								<h4 className="font-medium">Path Statistics</h4>
								<div className="grid grid-cols-2 gap-4">
									<div className="border rounded p-3">
										<p className="text-sm font-medium">
											Total Branches
										</p>
										<p className="text-2xl font-bold">
											{branchHistory.length +
												(branches.length > 0 ? 1 : 0)}
										</p>
									</div>
									<div className="border rounded p-3">
										<p className="text-sm font-medium">
											Explored Branches
										</p>
										<p className="text-2xl font-bold">
											{branchHistory.length}
										</p>
									</div>
									<div className="border rounded p-3">
										<p className="text-sm font-medium">
											Current Depth
										</p>
										<p className="text-2xl font-bold">
											{branchHistory.length + 1}
										</p>
									</div>
									<div className="border rounded p-3">
										<p className="text-sm font-medium">
											Available Choices
										</p>
										<p className="text-2xl font-bold">
											{branches.length}
										</p>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Footer with buttons */}
				<div className="border-t p-4 flex justify-end gap-3">
					<button
						className="px-4 py-2 border rounded hover:bg-gray-100"
						onClick={onClose}
					>
						Close
					</button>
					<button className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600">
						Save Story Branches
					</button>
				</div>
			</div>
		</div>
	);
}
