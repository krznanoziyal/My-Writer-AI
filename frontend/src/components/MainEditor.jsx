import {
	Bold,
	Clock,
	Italic,
	List,
	MessageSquare,
	Search,
	Type,
	Underline,
	Sparkles,
} from "lucide-react";
import { useState, useCallback, useEffect, useRef } from "react";
import { generateRewrite } from "../services/aiService";
import { marked } from "marked";

export default function MainEditor({
	activeDocument,
	editorContent,
	handleEditorChange,
	editorRef,
	isLoading,
	error,
	setIsLoading,
	setError,
}) {
	const [selectedText, setSelectedText] = useState("");
	const [selection, setSelection] = useState(null);
	const [showTooltip, setShowTooltip] = useState(false);
	const [range, setRange] = useState(null);
	const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

	useEffect(() => {
		if (
			editorRef.current &&
			editorRef.current.innerText !== editorContent
		) {
			editorRef.current.innerText = editorContent;
		}
	}, [editorContent, editorRef]);

	const handleInput = (e) => {
		handleEditorChange({ target: { value: e.target.innerText } });
	};

	const handleFormattingAction = (action) => {
		if (!range) return;

		let newNode;

		switch (action) {
			case "Bold":
				newNode = document.createElement("strong");
				break;
			case "Italic":
				newNode = document.createElement("em");
				break;
			case "Underline":
				newNode = document.createElement("u");
				break;
			default:
				return;
		}

		const selectedText = selection.toString();
		newNode.textContent = selectedText;

		range.deleteContents();
		range.insertNode(newNode);

		handleEditorChange({ target: { value: editorRef.current.innerText } });
	};

	const handleAiAction = useCallback(
		async (actionType, instruction) => {
			if (!selectedText || !range) return;

			setIsLoading(true);
			setError(null);
			setShowTooltip(false);

			try {
				let generatedText = "";
				const payload = {
					selection: selectedText,
					current_text: editorContent,
					instruction,
				};

				switch (actionType) {
					case "Rewrite":
						if (!payload.selection) {
							throw new Error("Please select text to rewrite.");
						}
						generatedText = await generateRewrite(payload);
						break;
					default:
						throw new Error(`Unsupported AI action: ${actionType}`);
				}

				// Preserve the range reference before we modify the DOM
				const rangeContainer = range.commonAncestorContainer;

				// Convert markdown to HTML and prepare fragment
				const html = marked.parse(generatedText);

				// Create a wrapper div to ensure proper formatting is preserved
				const wrapper = document.createElement("div");
				wrapper.innerHTML = html;

				// Style paragraphs for proper spacing if needed
				const paragraphs = wrapper.querySelectorAll("p");
				paragraphs.forEach((p) => {
					// Add bottom margin to paragraphs for spacing
					if (
						p.nextElementSibling &&
						p.nextElementSibling.tagName === "P"
					) {
						p.style.marginBottom = "1em";
					}
				});

				// Delete selected content and insert the new formatted content
				range.deleteContents();

				// Insert each child node individually to maintain formatting
				Array.from(wrapper.childNodes).forEach((node) => {
					range.insertNode(node.cloneNode(true));
					// Move the range point to after the inserted node
					range.setStartAfter(node);
					range.collapse(true);
				});

				// Update the editor content state
				handleEditorChange({
					target: { value: editorRef.current.innerText },
				});
			} catch (err) {
				console.error("AI Action failed:", err);
				setError(err.message || "Failed to perform AI action.");
				setShowTooltip(true);
			} finally {
				setIsLoading(false);
			}
		},
		[
			selectedText,
			editorContent,
			range,
			handleEditorChange,
			setIsLoading,
			setError,
			editorRef,
		]
	);

	const handleTextSelection = (e) => {
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
			const range = selection.getRangeAt(0);
			const selected = selection.toString();

			if (selected.trim()) {
				setSelectedText(selected);
				setSelection(selection);
				setRange(range);

				const rect = range.getBoundingClientRect();
				const editorRect = editorRef.current.getBoundingClientRect();

				setTooltipPosition({
					top: rect.top - editorRect.top - 40,
					left: rect.left - editorRect.left + rect.width / 2 - 50,
				});
				setShowTooltip(true);
			} else {
				setShowTooltip(false);
			}
		} else {
			setShowTooltip(false);
			setSelectedText("");
			setSelection(null);
			setRange(null);
		}
	};

	return (
		<div className="flex-1 flex flex-col bg-white">
			<EditorToolbar handleAction={handleFormattingAction} />

			<div className="flex-1 p-8 overflow-auto relative">
				<h1 className="text-2xl font-light text-gray-500 mb-4">
					{activeDocument}
				</h1>
				{error && (
					<div className="text-red-500 mb-2">Error: {error}</div>
				)}
				{isLoading && (
					<div className="text-blue-500 mb-2">Generating...</div>
				)}
				<div
					ref={editorRef}
					className="w-full h-[calc(100%-50px)] border-none outline-none text-base leading-relaxed text-gray-800 resize-none selection:bg-pink-200"
					contentEditable
					suppressContentEditableWarning={true}
					placeholder="Type here..."
					onInput={handleInput}
					onMouseUp={handleTextSelection}
					onKeyUp={handleTextSelection}
				></div>
				{showTooltip && (
					<Tooltip
						tooltipPosition={tooltipPosition}
						handleFormattingAction={handleFormattingAction}
						handleAiAction={handleAiAction}
					/>
				)}
			</div>

			<EditorFooter />
		</div>
	);
}

function Tooltip({ tooltipPosition, handleFormattingAction, handleAiAction }) {
	const [showRewriteMenu, setShowRewriteMenu] = useState(false);
	const [customInstruction, setCustomInstruction] = useState("");
	const [showCustomInput, setShowCustomInput] = useState(false);
	const rewriteOptions = [
		{ label: "Longer", instruction: "Rewrite the text to be longer." },
		{ label: "Shorter", instruction: "Rewrite the text to be shorter." },
		{
			label: "More Descriptive",
			instruction: "Rewrite the text to be more descriptive.",
		},
		{
			label: "More Intense",
			instruction: "Rewrite the text to be more intense.",
		},
		{ label: "Custom", instruction: null },
	];
	const menuRef = useRef();

	useEffect(() => {
		function handleClickOutside(e) {
			if (menuRef.current && !menuRef.current.contains(e.target)) {
				setShowRewriteMenu(false);
				setShowCustomInput(false);
			}
		}
		if (showRewriteMenu || showCustomInput) {
			document.addEventListener("mousedown", handleClickOutside);
			return () =>
				document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [showRewriteMenu, showCustomInput]);

	return (
		<div
			className="absolute bg-gray-800 text-white shadow-lg border border-gray-700 rounded p-1 flex gap-1 items-center z-10"
			style={{
				top: tooltipPosition.top + "px",
				left: tooltipPosition.left + "px",
			}}
			ref={menuRef}
		>
			<ToolbarIconButton
				icon={<Bold size={16} />}
				onClick={() => handleFormattingAction("Bold")}
				tooltip="Bold"
			/>
			<ToolbarIconButton
				icon={<Italic size={16} />}
				onClick={() => handleFormattingAction("Italic")}
				tooltip="Italic"
			/>
			<ToolbarIconButton
				icon={<Underline size={16} />}
				onClick={() => handleFormattingAction("Underline")}
				tooltip="Underline"
			/>
			<div className="border-l border-gray-600 h-4 mx-1"></div>
			<div className="relative">
				<ToolbarIconButton
					icon={<Sparkles size={16} />}
					onClick={() => setShowRewriteMenu((v) => !v)}
					tooltip="Rewrite Selection"
				/>
				{showRewriteMenu && (
					<div className="absolute left-0 top-8 bg-white text-gray-900 rounded shadow-lg min-w-[180px] z-20">
						{rewriteOptions.map((opt) => (
							<button
								key={opt.label}
								className="block w-full text-left px-4 py-2 hover:bg-pink-100"
								onClick={() => {
									setShowRewriteMenu(false);
									if (opt.label === "Custom") {
										setShowCustomInput(true);
									} else {
										handleAiAction(
											"Rewrite",
											opt.instruction
										);
									}
								}}
							>
								{opt.label}
							</button>
						))}
					</div>
				)}
				{showCustomInput && (
					<div className="absolute left-0 top-8 bg-white text-gray-900 rounded shadow-lg p-3 z-30 min-w-[220px]">
						<div className="mb-2 text-sm">Custom Instruction:</div>
						<input
							className="w-full border rounded px-2 py-1 text-sm mb-2"
							value={customInstruction}
							onChange={(e) =>
								setCustomInstruction(e.target.value)
							}
							placeholder="e.g. Rewrite in a humorous tone"
							autoFocus
						/>
						<div className="flex gap-2 justify-end">
							<button
								className="px-3 py-1 rounded bg-pink-500 text-white text-sm hover:bg-pink-600"
								onClick={() => {
									setShowCustomInput(false);
									handleAiAction(
										"Rewrite",
										customInstruction || undefined
									);
								}}
								disabled={!customInstruction.trim()}
							>
								Go
							</button>
							<button
								className="px-2 py-1 rounded text-gray-600 hover:bg-gray-100 text-sm"
								onClick={() => setShowCustomInput(false)}
							>
								Cancel
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function EditorFooter() {
	return (
		<div className="flex justify-between p-2 px-4 border-t border-gray-200">
			<FooterButton icon={<MessageSquare size={16} />} label="Comments" />
			<FooterButton icon={<Clock size={16} />} label="History" />
		</div>
	);
}

function FooterButton({ icon, label }) {
	return (
		<button className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-600 rounded hover:bg-gray-100">
			{icon}
			<span>{label}</span>
		</button>
	);
}

function EditorToolbar({ handleAction }) {
	return (
		<div className="flex p-2 border-b border-gray-200 gap-1">
			<ToolbarIconButton icon={<Search size={16} />} tooltip="Search" />
			<ToolbarIconButton
				icon={<Type size={16} />}
				tooltip="Text Formatting"
			/>
			<ToolbarIconButton
				icon={<List size={16} />}
				tooltip="List Formatting"
			/>
		</div>
	);
}

function ToolbarIconButton({ icon, onClick, tooltip }) {
	return (
		<button
			className="p-1.5 rounded text-gray-600 hover:bg-gray-100 relative group"
			onClick={onClick}
		>
			{icon}
			{tooltip && (
				<span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
					{tooltip}
				</span>
			)}
		</button>
	);
}
