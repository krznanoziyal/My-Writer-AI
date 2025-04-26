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
} from "lucide-react";

export default function LeftSidebar({
  isStoryBibleEnabled,
  setIsStoryBibleEnabled,
}) {
  return (
    <div className="w-64 border-r border-gray-200 p-4 flex flex-col bg-white lg:block md:w-52 sm:hidden">
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
      />

      <div className="mt-auto">
        <SidebarButton icon={<Trash2 size={16} />} label="Trash" />
      </div>
    </div>
  );
}
function StoryBibleSection({ isStoryBibleEnabled, setIsStoryBibleEnabled }) {
  return (
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
              isStoryBibleEnabled ? "before:translate-x-4 bg-pink-400" : ""
            }`}
          ></span>
        </label>
      </div>

      <div className="ml-6">
        <SidebarItem icon={<Brain size={16} />} label="Braindump" />
        <SidebarItem icon={<Type size={16} />} label="Genre" />
        <SidebarItem icon={<Italic size={16} />} label="Style" />
        <SidebarItem icon={<FileText size={16} />} label="Synopsis" />
        <SidebarItem icon={<MessageSquare size={16} />} label="Characters" />
        <SidebarItem icon={<Layout size={16} />} label="Worldbuilding" />
        <SidebarItem icon={<List size={16} />} label="Outline" />
      </div>
    </div>
  );
}
function SidebarItem({ icon, label, active }) {
  return (
    <div
      className={`flex items-center gap-2 p-2 rounded ${
        active ? "text-blue-600 bg-blue-50" : "text-gray-600 hover:bg-gray-100"
      }`}
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
