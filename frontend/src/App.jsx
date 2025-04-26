import { useRef, useState } from "react";
import RightSidebar from "./components/RightSidebar";
import MainEditor from "./components/MainEditor";
import LeftSidebar from "./components/LeftSidebar";
import TopNavigationBar from "./components/TopNavigationBar";

// Editor Toolbar Component

// Toolbar Icon Button Component

function App() {
  const [isStoryBibleEnabled, setIsStoryBibleEnabled] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [saved, setSaved] = useState(true);
  const [activeDocument, setActiveDocument] = useState("Untitled 2");
  const [editorContent, setEditorContent] = useState("");

  const editorRef = useRef(null);

  const handleEditorChange = (e) => {
    setEditorContent(e.target.value);
    const words = e.target.value.trim().split(/\s+/);
    setWordCount(e.target.value.trim() ? words.length : 0);
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
  };

  return (
    <div className="flex flex-col h-screen">
      <TopNavigationBar
        wordCount={wordCount}
        saved={saved}
        handleSave={handleSave}
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
        />
        <RightSidebar isStoryBibleEnabled={isStoryBibleEnabled} />
      </div>
    </div>
  );
}

export default App;
