import {
  Bold,
  Clock,
  Italic,
  List,
  MessageSquare,
  Search,
  Type,
  Underline,
} from "lucide-react";
import { useState } from "react";

export default function MainEditor({
  activeDocument,
  editorContent,
  handleEditorChange,
  editorRef,
}) {
  const [selectedText, setSelectedText] = useState("");
  const [selection, setSelection] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [range, setRange] = useState(null);

  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const handleInput = (e) => {
    handleEditorChange({ target: { value: e.target.innerText } });
  };

  const handleAction = (action) => {
    if (!range) return; // No text selected

    let newNode;

    switch (action) {
      case "Bold":
        newNode = document.createElement("strong"); // <strong> for bold
        break;
      case "Italic":
        newNode = document.createElement("em"); // <em> for italic
        break;
      case "Underline":
        newNode = document.createElement("u"); // <u> for underline
        break;
      default:
        return;
    }

    const selectedText = selection.toString();
    newNode.textContent = selectedText;

    // Replace selected text with the new node
    range.deleteContents();
    range.insertNode(newNode);
  };

  const handleTextSelection = (e) => {
    const textarea = editorRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    setSelection(selection);
    setRange(range);

    if (start !== end) {
      const selected = editorContent.substring(start, end);
      setSelectedText(selected);

      const textareaRect = textarea.getBoundingClientRect();

      setTooltipPosition({
        top: textareaRect.top + 30,
        left: textareaRect.left + 100,
      });

      setShowTooltip(true);
    } else {
      setSelectedText("");
      setShowTooltip(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      <EditorToolbar handleAction={handleAction} />

      <div className="flex-1 p-8 overflow-auto relative">
        <h1 className="text-2xl font-light text-gray-500 mb-4">
          {activeDocument}
        </h1>
        <div
          ref={editorRef}
          className="w-full h-[calc(100%-50px)]  border-none outline-none text-base leading-relaxed text-gray-800 resize-none selection:bg-pink-200"
          contentEditable
          placeholder="Type here..."
          onInput={handleInput}
          onSelect={handleTextSelection}
        ></div>

        {showTooltip && (
          <Tooltip
            tooltipPosition={tooltipPosition}
            handleAction={handleAction}
          />
        )}
      </div>

      <EditorFooter />
    </div>
  );
}

function Tooltip({ tooltipPosition, handleAction }) {
  return (
    <div
      className="absolute bg-white shadow-md border border-gray-200 rounded p-2 flex gap-2 items-center z-10"
      style={{
        top: tooltipPosition.top + "px",
        left: tooltipPosition.left + "px",
      }}
    >
      <ToolbarIconButton
        icon={<Bold size={16} />}
        onClick={() => handleAction("Bold")}
      />
      <ToolbarIconButton
        icon={<Italic size={16} />}
        onClick={() => handleAction("Italic")}
      />
      <ToolbarIconButton
        icon={<Underline size={16} />}
        onClick={() => handleAction("Underline")}
      />
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
      <ToolbarIconButton icon={<Search size={16} />} />
      <ToolbarIconButton
        icon={<Bold size={16} />}
        onClick={() => handleAction("Bold")}
      />
      <ToolbarIconButton
        icon={<Italic size={16} />}
        onClick={() => handleAction("Italic")}
      />
      <ToolbarIconButton
        icon={<Underline size={16} />}
        onClick={() => handleAction("Underline")}
      />
      <ToolbarIconButton icon={<Type size={16} />} />
      <ToolbarIconButton icon={<List size={16} />} />
    </div>
  );
}
function ToolbarIconButton({ icon, onClick }) {
  return (
    <button
      className="p-1.5 rounded text-gray-600 hover:bg-gray-100"
      onClick={onClick}
    >
      {icon}
    </button>
  );
}
