import { useState, useRef } from "react";
import {
  ChevronLeft,
  PenTool,
  RefreshCw,
  FileText,
  Brain,
  Puzzle,
  Search,
  ArrowLeft,
  ArrowRight,
  Bold,
  Italic,
  Underline,
  Type,
  List,
  Save,
  Clock,
  MessageSquare,
  Plus,
  Download,
  Trash2,
  Layout,
} from "lucide-react";

function App() {
  const [isStoryBibleEnabled, setIsStoryBibleEnabled] = useState(true);
  const [wordCount, setWordCount] = useState(0);
  const [saved, setSaved] = useState(true);
  const [activeDocument, setActiveDocument] = useState("Untitled 2");
  const [editorContent, setEditorContent] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const editorRef = useRef(null);

  const handleEditorChange = (e) => {
    setEditorContent(e.target.value);
    // Simple word count calculation
    const words = e.target.value.trim().split(/\s+/);
    setWordCount(e.target.value.trim() ? words.length : 0);
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    // Here you would implement actual saving functionality
  };

  // Since textareas don't support rich text formatting, we'll implement a workaround
  // by replacing the selected text with formatted text markers
  const handleAction = (action) => {
    if (!selectedText) return;

    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    let formattedText = selectedText;
    let prefix = "";
    let suffix = "";

    switch (action) {
      case "Bold":
        prefix = "**";
        suffix = "**";
        break;
      case "Italic":
        prefix = "_";
        suffix = "_";
        break;
      case "Underline":
        prefix = "__";
        suffix = "__";
        break;
      default:
        return;
    }

    // Create new content with formatting marks
    const newContent =
      editorContent.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      editorContent.substring(end);

    // Update the editor content
    setEditorContent(newContent);

    // Hide the tooltip
    setShowTooltip(false);

    // Set cursor position after the formatted text
    setTimeout(() => {
      textarea.focus();
      const newPosition =
        start + prefix.length + selectedText.length + suffix.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const handleTextSelection = (e) => {
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      const selected = editorContent.substring(start, end);
      setSelectedText(selected);

      // Calculate tooltip position based on the selection
      // Since we can't easily get the coordinates of text in a textarea,
      // we'll position it relative to the textarea
      const textareaRect = textarea.getBoundingClientRect();

      // This is an approximation and might need adjustment
      setTooltipPosition({
        top: textareaRect.top + 30, // Position below the approximate line
        left: textareaRect.left + 100, // Position somewhere in the middle
      });

      setShowTooltip(true);
    } else {
      setSelectedText("");
      setShowTooltip(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top Navigation Bar */}
      <div className="flex justify-between items-center p-2 bg-gradient-to-r from-pink-200 to-pink-100 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button className="flex items-center text-gray-600 px-2.5 py-1.5 rounded hover:bg-gray-100/50">
            <ChevronLeft size={16} />
            <span className="ml-1">Back</span>
          </button>
        </div>

        <div className="flex items-center">
          <div className="flex items-center bg-white rounded-full p-1 shadow-sm">
            <button className="flex items-center text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-100/50">
              <PenTool size={16} />
              <span className="mx-1.5">Write</span>
              <ChevronLeft className="transform rotate-90" size={16} />
            </button>

            <div className="w-px h-6 bg-gray-200"></div>

            <button className="flex items-center text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-100/50">
              <RefreshCw size={16} />
              <span className="mx-1.5">Rewrite</span>
              <ChevronLeft className="transform rotate-90" size={16} />
            </button>

            <div className="w-px h-6 bg-gray-200"></div>

            <button className="flex items-center text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-100/50">
              <FileText size={16} />
              <span className="mx-1.5">Describe</span>
              <ChevronLeft className="transform rotate-90" size={16} />
            </button>

            <div className="w-px h-6 bg-gray-200"></div>

            <button className="flex items-center text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-100/50">
              <Brain size={16} />
              <span className="mx-1.5">Brainstorm</span>
            </button>

            <div className="w-px h-6 bg-gray-200"></div>

            <button className="flex items-center text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-100/50">
              <Puzzle size={16} />
              <span className="mx-1.5">Plugins</span>
              <ChevronLeft className="transform rotate-90" size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Words: {wordCount}</span>
          <span
            className="text-sm text-gray-600 flex items-center gap-1 cursor-pointer"
            onClick={handleSave}
          >
            {saved ? (
              <>
                <Save size={16} className="text-green-500" />
                Saved
              </>
            ) : (
              "Unsaved"
            )}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-gray-200 p-4 flex flex-col bg-white lg:block md:w-52 sm:hidden">
          <div className="flex gap-2 mb-4">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 border border-gray-200 rounded text-sm">
              <Plus size={16} />
              <span>New</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 border border-gray-200 rounded text-sm">
              <Download size={16} />
              <span>Import</span>
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 p-2 rounded text-gray-600 hover:bg-gray-100">
              <FileText size={16} />
              <span>Untitled</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded text-blue-600 bg-blue-50">
              <FileText size={16} />
              <span>Untitled 2</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-pink-400" />
                <span className="text-pink-400 font-medium">Story Bible</span>
              </div>
              <label className="relative inline-block w-9 h-5">
                <input
                  type="checkbox"
                  className="opacity-0 w-0 h-0"
                  checked={isStoryBibleEnabled}
                  onChange={() => setIsStoryBibleEnabled(!isStoryBibleEnabled)}
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

            <div className="ml-6">
              <div className="flex items-center gap-2 py-1.5 text-gray-600 cursor-pointer hover:text-gray-800">
                <Brain size={16} />
                <span>Braindump</span>
              </div>
              <div className="flex items-center gap-2 py-1.5 text-gray-600 cursor-pointer hover:text-gray-800">
                <Type size={16} />
                <span>Genre</span>
              </div>
              <div className="flex items-center gap-2 py-1.5 text-gray-600 cursor-pointer hover:text-gray-800">
                <Italic size={16} />
                <span>Style</span>
              </div>
              <div className="flex items-center gap-2 py-1.5 text-gray-600 cursor-pointer hover:text-gray-800">
                <FileText size={16} />
                <span>Synopsis</span>
              </div>
              <div className="flex items-center gap-2 py-1.5 text-gray-600 cursor-pointer hover:text-gray-800">
                <MessageSquare size={16} />
                <span>Characters</span>
              </div>
              <div className="flex items-center gap-2 py-1.5 text-gray-600 cursor-pointer hover:text-gray-800">
                <Layout size={16} />
                <span>Worldbuilding</span>
              </div>
              <div className="flex items-center gap-2 py-1.5 text-gray-600 cursor-pointer hover:text-gray-800">
                <List size={16} />
                <span>Outline</span>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <button className="flex items-center gap-2 p-2 text-gray-600 rounded hover:bg-gray-100">
              <Trash2 size={16} />
              <span>Trash</span>
            </button>
          </div>
        </div>

        {/* Main Editor */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Editor Toolbar */}
          <div className="flex p-2 border-b border-gray-200 gap-1">
            <button className="p-1.5 rounded text-gray-600 hover:bg-gray-100">
              <Search size={16} />
            </button>
            <button
              className="p-1.5 rounded text-gray-600 hover:bg-gray-100"
              onClick={() => handleAction("Bold")}
            >
              <Bold size={16} />
            </button>
            <button
              className="p-1.5 rounded text-gray-600 hover:bg-gray-100"
              onClick={() => handleAction("Italic")}
            >
              <Italic size={16} />
            </button>
            <button
              className="p-1.5 rounded text-gray-600 hover:bg-gray-100"
              onClick={() => handleAction("Underline")}
            >
              <Underline size={16} />
            </button>
            <button className="p-1.5 rounded text-gray-600 hover:bg-gray-100">
              <Type size={16} />
            </button>
            <button className="p-1.5 rounded text-gray-600 hover:bg-gray-100">
              <List size={16} />
            </button>
          </div>

          {/* Editor Content */}
          <div className="flex-1 p-8 overflow-auto relative">
            <h1 className="text-2xl font-light text-gray-500 mb-4">
              {activeDocument}
            </h1>
            <textarea
              ref={editorRef}
              className="w-full h-[calc(100%-50px)] border-none outline-none text-base leading-relaxed text-gray-800 resize-none selection:bg-pink-200"
              placeholder="Type here..."
              value={editorContent}
              onChange={handleEditorChange}
              onSelect={handleTextSelection}
            ></textarea>

            {showTooltip && (
              <div
                className="absolute bg-white shadow-md border border-gray-200 rounded p-2 flex gap-2 items-center z-10"
                style={{
                  top: tooltipPosition.top + "px",
                  left: tooltipPosition.left + "px",
                }}
              >
                <button
                  className="text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100"
                  onClick={() => handleAction("Bold")}
                >
                  <Bold size={16} />
                </button>
                <button
                  className="text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100"
                  onClick={() => handleAction("Italic")}
                >
                  <Italic size={16} />
                </button>
                <button
                  className="text-gray-600 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100"
                  onClick={() => handleAction("Underline")}
                >
                  <Underline size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Editor Footer */}
          <div className="flex justify-between p-2 px-4 border-t border-gray-200">
            <div>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-600 rounded hover:bg-gray-100">
                <MessageSquare size={16} />
                <span>Comments</span>
              </button>
            </div>
            <div>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-600 rounded hover:bg-gray-100">
                <Clock size={16} />
                <span>History</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Story Bible */}
        {isStoryBibleEnabled && (
          <div className="w-72 border-l border-gray-200 p-4 bg-white hidden lg:block">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2 font-medium">
                <FileText size={20} />
                <span>Story Bible</span>
              </div>
              <button className="text-sm text-gray-600">See less</button>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed">
              Story Bible helps you outline, generate characters, build your
              world, and best of all, generate prose that sounds more like you!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
