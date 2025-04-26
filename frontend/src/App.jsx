import { useRef, useState, useCallback } from "react";
import RightSidebar from "./components/RightSidebar";
import MainEditor from "./components/MainEditor";
import LeftSidebar from "./components/LeftSidebar";
import TopNavigationBar from "./components/TopNavigationBar";
import {
	generateWrite,
	generateDescribe,
	generateBrainstorm,
} from "./services/aiService";

function App() {
	const [isStoryBibleEnabled, setIsStoryBibleEnabled] = useState(true);
	const [wordCount, setWordCount] = useState(0);
	const [saved, setSaved] = useState(true);
	const [activeDocument, setActiveDocument] = useState("Untitled 2");
	const [editorContent, setEditorContent] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState(null);
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
			const newContent = editorContent + "\n" + generatedText;
			setEditorContent(newContent);
			if (editorRef.current) {
				editorRef.current.innerText = newContent;
			}
			handleEditorChange({ target: { value: newContent } });
		} catch (err) {
			console.error("Generate Write failed:", err);
			setError(err.message || "Failed to generate text.");
		} finally {
			setIsLoading(false);
		}
	}, [editorContent, handleEditorChange, storyContext]);

	const handleGenerateDescribe = useCallback(async () => {
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
			const newContent =
				editorContent + "\n\n[Description]:\n" + generatedText;
			setEditorContent(newContent);
			if (editorRef.current) {
				editorRef.current.innerText = newContent;
			}
			handleEditorChange({ target: { value: newContent } });
		} catch (err) {
			console.error("Generate Describe failed:", err);
			setError(err.message || "Failed to generate description.");
		} finally {
			setIsLoading(false);
		}
	}, [editorContent, handleEditorChange, storyContext]);

	const handleGenerateBrainstorm = useCallback(async () => {
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
			const newContent =
				editorContent + "\n\n[Brainstorm Ideas]:\n" + generatedText;
			setEditorContent(newContent);
			if (editorRef.current) {
				editorRef.current.innerText = newContent;
			}
			handleEditorChange({ target: { value: newContent } });
		} catch (err) {
			console.error("Generate Brainstorm failed:", err);
			setError(err.message || "Failed to brainstorm ideas.");
		} finally {
			setIsLoading(false);
		}
	}, [editorContent, handleEditorChange, storyContext]);

	return (
		<div className="flex flex-col h-screen">
			<TopNavigationBar
				wordCount={wordCount}
				saved={saved}
				handleSave={handleSave}
				onGenerateWrite={handleGenerateWrite}
				onGenerateDescribe={handleGenerateDescribe}
				onGenerateBrainstorm={handleGenerateBrainstorm}
			/>
			<div className="flex flex-1 overflow-hidden">
				<LeftSidebar
					isStoryBibleEnabled={isStoryBibleEnabled}
					setIsStoryBibleEnabled={setIsStoryBibleEnabled}
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
		</div>
	);
}

export default App;
