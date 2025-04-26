import { useRef, useState, useCallback } from "react";
import RightSidebar from "./components/RightSidebar";
import MainEditor from "./components/MainEditor";
import LeftSidebar from "./components/LeftSidebar";
import TopNavigationBar from "./components/TopNavigationBar";
import CreativeBranchingDialog from "./components/CreativeBranchingDialog";
import BrainstormDialog from "./components/BrainstormDialog";
import {
	generateWrite,
	generateDescribe,
	generateBrainstorm,
} from "./services/aiService";
import { marked } from "marked";

function App() {
	const [isStoryBibleEnabled, setIsStoryBibleEnabled] = useState(true);
	const [wordCount, setWordCount] = useState(0);
	const [saved, setSaved] = useState(true);
	const [activeDocument, setActiveDocument] = useState("Untitled 2");
	const [editorContent, setEditorContent] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [isCreativeBranchingOpen, setIsCreativeBranchingOpen] =
		useState(false);
	const [isBrainstormDialogOpen, setIsBrainstormDialogOpen] = useState(false);
	const [storyContext, setStoryContext] = useState({
		genre: "",
		style: "",
		synopsis: "",
		characters: "",
		worldbuilding: "",
		outline: "",
		target_audience_age: "",
	});

	const editorRef = useRef(null);

	// Toggle creative branching dialog
	const toggleCreativeBranching = useCallback(() => {
		setIsCreativeBranchingOpen(!isCreativeBranchingOpen);
	}, [isCreativeBranchingOpen]);

	// Toggle brainstorm dialog
	const toggleBrainstormDialog = useCallback(() => {
		setIsBrainstormDialogOpen(!isBrainstormDialogOpen);
	}, [isBrainstormDialogOpen]);

	const handleEditorChange = useCallback((e) => {
		const newContent = e.target.value;
		setEditorContent(newContent);
		const words = newContent.trim().split(/\s+/);
		setWordCount(newContent.trim() ? words.length : 0);
		setSaved(false);
	}, []);

	const handleSave = () => {
		console.log("Saving content:", editorContent);
		setSaved(true);
	};

	const handleGenerateWrite = useCallback(async () => {
		console.log("handleGenerateWrite called");
		setIsLoading(true);
		setError(null);
		try {
			const payload = {
				instruction:
					"Continue writing the story based on the current text.",
				current_text: editorContent,
				story_context: Object.values(storyContext).some(Boolean)
					? storyContext
					: undefined,
			};
			const generatedText = await generateWrite(payload);

			// Convert markdown to HTML with proper paragraph styling
			const html = marked.parse(generatedText);

			// Insert the HTML content
			if (editorRef.current) {
				// If there's existing content, add a proper paragraph break
				if (editorContent.trim()) {
					// Add two paragraph elements to create visual spacing between content
					editorRef.current.innerHTML =
						editorRef.current.innerHTML +
						'<div class="paragraph-break" style="margin: 1em 0;"></div>' +
						html;
				} else {
					// If no content, just set the HTML directly
					editorRef.current.innerHTML = html;
				}

				// Get the new content as text for tracking state
				const newContent = editorRef.current.innerText;
				setEditorContent(newContent);
				handleEditorChange({ target: { value: newContent } });
			}
		} catch (err) {
			console.error("Generate Write failed:", err);
			setError(err.message || "Failed to generate text.");
		} finally {
			setIsLoading(false);
		}
	}, [editorContent, handleEditorChange, storyContext]);

	const handleGenerateDescribe = useCallback(async () => {
		console.log("handleGenerateDescribe called");
		setIsLoading(true);
		setError(null);
		try {
			const payload = {
				instruction: "Describe the last paragraph or concept.",
				current_text: editorContent,
				story_context: Object.values(storyContext).some(Boolean)
					? storyContext
					: undefined,
			};
			const generatedText = await generateDescribe(payload);

			// Convert markdown to HTML with proper paragraph styling
			const html = marked.parse(`\n\n**Description:**\n${generatedText}`);

			// Insert the HTML content
			if (editorRef.current) {
				// If there's existing content, add a proper paragraph break
				if (editorContent.trim()) {
					editorRef.current.innerHTML =
						editorRef.current.innerHTML +
						'<div class="paragraph-break" style="margin: 1em 0;"></div>' +
						html;
				} else {
					editorRef.current.innerHTML = html;
				}

				// Get the new content as text for tracking state
				const newContent = editorRef.current.innerText;
				setEditorContent(newContent);
				handleEditorChange({ target: { value: newContent } });
			}
		} catch (err) {
			console.error("Generate Describe failed:", err);
			setError(err.message || "Failed to generate description.");
		} finally {
			setIsLoading(false);
		}
	}, [editorContent, handleEditorChange, storyContext]);

	const handleGenerateBrainstorm = useCallback(async () => {
		console.log("handleGenerateBrainstorm called");
		setIsLoading(true);
		setError(null);
		try {
			const payload = {
				instruction:
					"Brainstorm ideas based on the current story progress.",
				current_text: editorContent,
				story_context: Object.values(storyContext).some(Boolean)
					? storyContext
					: undefined,
			};
			const generatedText = await generateBrainstorm(payload);

			// Convert markdown to HTML with proper paragraph styling
			const html = marked.parse(
				`\n\n**Brainstorm Ideas:**\n${generatedText}`
			);

			// Insert the HTML content
			if (editorRef.current) {
				// If there's existing content, add a proper paragraph break
				if (editorContent.trim()) {
					editorRef.current.innerHTML =
						editorRef.current.innerHTML +
						'<div class="paragraph-break" style="margin: 1em 0;"></div>' +
						html;
				} else {
					editorRef.current.innerHTML = html;
				}

				// Get the new content as text for tracking state
				const newContent = editorRef.current.innerText;
				setEditorContent(newContent);
				handleEditorChange({ target: { value: newContent } });
			}
		} catch (err) {
			console.error("Generate Brainstorm failed:", err);
			setError(err.message || "Failed to brainstorm ideas.");
		} finally {
			setIsLoading(false);
		}
	}, [editorContent, handleEditorChange, storyContext]);

	const handleBrainstormResult = useCallback(
		(generatedText) => {
			// Convert markdown to HTML with proper paragraph styling
			const html = marked.parse(
				`\n\n**Brainstorm Results:**\n${generatedText}`
			);

			// Insert the HTML content
			if (editorRef.current) {
				// If there's existing content, add a proper paragraph break
				if (editorContent.trim()) {
					editorRef.current.innerHTML =
						editorRef.current.innerHTML +
						'<div class="paragraph-break" style="margin: 1em 0;"></div>' +
						html;
				} else {
					editorRef.current.innerHTML = html;
				}

				// Get the new content as text for tracking state
				const newContent = editorRef.current.innerText;
				setEditorContent(newContent);
				handleEditorChange({ target: { value: newContent } });
			}
		},
		[editorContent, handleEditorChange]
	);

	return (
		<div className="flex flex-col h-screen">
			<TopNavigationBar
				wordCount={wordCount}
				saved={saved}
				handleSave={handleSave}
				onGenerateWrite={handleGenerateWrite}
				onGenerateDescribe={handleGenerateDescribe}
				onGenerateBrainstorm={toggleBrainstormDialog} // Update to open dialog instead of direct generation
				onOpenCreativeBranching={toggleCreativeBranching}
				onOpenBrainstormDialog={toggleBrainstormDialog}
			/>
			<div className="flex flex-1 overflow-hidden">
				<LeftSidebar
					isStoryBibleEnabled={isStoryBibleEnabled}
					setIsStoryBibleEnabled={setIsStoryBibleEnabled}
					storyContext={storyContext}
					setStoryContext={setStoryContext}
					editorContent={editorContent}
				/>
				<MainEditor
					activeDocument={activeDocument}
					editorContent={editorContent}
					handleEditorChange={handleEditorChange}
					editorRef={editorRef}
					isLoading={isLoading}
					error={error}
					setIsLoading={setIsLoading}
					setError={setError}
				/>
				<RightSidebar
					isStoryBibleEnabled={isStoryBibleEnabled}
					storyContext={storyContext}
					setStoryContext={setStoryContext}
				/>
			</div>
			<CreativeBranchingDialog
				isOpen={isCreativeBranchingOpen}
				onClose={() => setIsCreativeBranchingOpen(false)}
				editorContent={editorContent}
				storyContext={storyContext}
			/>
			<BrainstormDialog
				isOpen={isBrainstormDialogOpen}
				onClose={() => setIsBrainstormDialogOpen(false)}
				editorContent={editorContent}
				storyContext={storyContext}
				onBrainstormGenerated={handleBrainstormResult}
			/>
		</div>
	);
}

export default App;
