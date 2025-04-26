import { FileText } from "lucide-react";

export default function RightSidebar({ isStoryBibleEnabled }) {
  if (!isStoryBibleEnabled) return null;

  return (
    <div className="w-72 border-l border-gray-200 p-4 bg-white hidden lg:block">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2 font-medium">
          <FileText size={20} />
          <span>Story Bible</span>
        </div>
        <button className="text-sm text-gray-600">See less</button>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed">
        Story Bible helps you outline, generate characters, build your world,
        and best of all, generate prose that sounds more like you!
      </p>
    </div>
  );
}
