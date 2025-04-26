import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

export default function RightSidebar({
	isStoryBibleEnabled,
	storyContext,
	setStoryContext,
}) {
	const [showContext, setShowContext] = useState(true);
	if (!isStoryBibleEnabled) return null;

	return (
		<div className="w-80 border-l border-gray-200 p-4 bg-white hidden lg:block">
			<div className="flex justify-between items-center mb-4">
				<div className="flex items-center gap-2 font-medium">
					<FileText size={20} />
					<span>Story Bible</span>
				</div>
				<button
					className="text-sm text-gray-600 flex items-center gap-1"
					onClick={() => setShowContext((v) => !v)}
				>
					{showContext ? (
						<ChevronUp size={16} />
					) : (
						<ChevronDown size={16} />
					)}
					{showContext ? "Hide" : "Show"}
				</button>
			</div>
			{showContext && (
				<div className="space-y-3">
					<ContextField
						label="Genre"
						value={storyContext.genre}
						onChange={(v) =>
							setStoryContext((c) => ({ ...c, genre: v }))
						}
					/>
					<ContextField
						label="Style"
						value={storyContext.style}
						onChange={(v) =>
							setStoryContext((c) => ({ ...c, style: v }))
						}
					/>
					<ContextField
						label="Synopsis"
						value={storyContext.synopsis}
						onChange={(v) =>
							setStoryContext((c) => ({ ...c, synopsis: v }))
						}
						textarea
					/>
					<ContextField
						label="Characters"
						value={storyContext.characters}
						onChange={(v) =>
							setStoryContext((c) => ({ ...c, characters: v }))
						}
						textarea
					/>
					<ContextField
						label="Worldbuilding"
						value={storyContext.worldbuilding}
						onChange={(v) =>
							setStoryContext((c) => ({ ...c, worldbuilding: v }))
						}
						textarea
					/>
					<ContextField
						label="Outline"
						value={storyContext.outline}
						onChange={(v) =>
							setStoryContext((c) => ({ ...c, outline: v }))
						}
						textarea
					/>
					<ContextField
						label="Target Audience Age"
						value={storyContext.target_audience_age}
						onChange={(v) =>
							setStoryContext((c) => ({
								...c,
								target_audience_age: v,
							}))
						}
					/>
				</div>
			)}
			<p className="text-xs text-gray-500 mt-4">
				Story Bible helps you outline, generate characters, build your
				world, and generate prose that sounds more like you!
			</p>
		</div>
	);
}

function ContextField({ label, value, onChange, textarea }) {
	return (
		<div>
			<label className="block text-xs font-medium text-gray-700 mb-1">
				{label}
			</label>
			{textarea ? (
				<textarea
					className="w-full border rounded px-2 py-1 text-xs"
					rows={2}
					value={value}
					onChange={(e) => onChange(e.target.value)}
				/>
			) : (
				<input
					className="w-full border rounded px-2 py-1 text-xs"
					value={value}
					onChange={(e) => onChange(e.target.value)}
				/>
			)}
		</div>
	);
}
