import {
  Brain,
  ChevronLeft,
  FileText,
  PenTool,
  Puzzle,
  RefreshCw,
  Save,
} from "lucide-react";

export default function TopNavigationBar({ wordCount, saved, handleSave }) {
  return (
    <div className="flex justify-between items-center p-2 bg-gradient-to-r from-pink-200 to-pink-100 border-b border-gray-200">
      <div className="flex items-center gap-4">
        <button className="flex items-center text-gray-600 px-2.5 py-1.5 rounded hover:bg-gray-100/50">
          <ChevronLeft size={16} />
          <span className="ml-1">Back</span>
        </button>
      </div>

      <div className="flex items-center">
        <div className="flex items-center bg-white rounded-full p-1 shadow-sm">
          <ToolbarButton icon={<PenTool size={16} />} label="Write" />
          <Divider />
          <ToolbarButton icon={<RefreshCw size={16} />} label="Rewrite" />
          <Divider />
          <ToolbarButton icon={<FileText size={16} />} label="Describe" />
          <Divider />
          <ToolbarButton icon={<Brain size={16} />} label="Brainstorm" />
          <Divider />
          <ToolbarButton icon={<Puzzle size={16} />} label="Plugins" />
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
  );
}
function ToolbarButton({ icon, label }) {
  return (
    <button className="flex items-center text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-100/50">
      {icon}
      <span className="mx-1.5">{label}</span>
      <ChevronLeft className="transform rotate-90" size={16} />
    </button>
  );
}
function Divider() {
  return <div className="w-px h-6 bg-gray-200"></div>;
}
