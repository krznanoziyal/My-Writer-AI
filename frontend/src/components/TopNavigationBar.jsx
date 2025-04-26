import {
	Brain,
	ChevronLeft,
	ChevronDown, // Import ChevronDown for dropdown indicator
	FileText,
	PenTool,
	Puzzle,
	RefreshCw,
	Save,
	SlidersHorizontal, // Import SlidersHorizontal for Context button
	GitBranch, // Import GitBranch for Creative Branching button
} from "lucide-react";

export default function TopNavigationBar({
	wordCount,
	saved,
	handleSave,
	// Receive AI handlers from App.jsx
	onGenerateWrite,
	onGenerateRewrite, // Add prop for rewrite if needed later
	onGenerateDescribe,
	onGenerateBrainstorm,
	onShowContextPanel, // Add prop for Context button
	onOpenCreativeBranching, // Add prop for Creative Branching button
	onOpenBrainstormDialog, // Add prop for Brainstorm dialog
}) {
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
					<ToolbarButton
						icon={<PenTool size={16} />}
						label="Write"
						onClick={onGenerateWrite} // Attach handler
					/>
					<Divider />
					<ToolbarButton
						icon={<RefreshCw size={16} />}
						label="Rewrite"
						onClick={onGenerateRewrite} // Attach handler (if implemented)
						// disabled // Disable if not implemented yet
					/>
					<Divider />
					<ToolbarButton
						icon={<FileText size={16} />}
						label="Describe"
						onClick={onGenerateDescribe} // Attach handler
					/>
					<Divider />
					<ToolbarButton
						icon={<Brain size={16} />}
						label="Brainstorm"
						onClick={onOpenBrainstormDialog} // Use the new dialog instead of direct generation
					/>
					<Divider />
					<ToolbarButton
						icon={<Puzzle size={16} />}
						label="Plugins"
						// No handler attached
					/>
					<Divider />
					<ToolbarButton
						icon={<SlidersHorizontal size={16} />}
						label="Context"
						onClick={onShowContextPanel} // Attach handler for Context button
					/>
					<Divider />
					<ToolbarButton
						icon={<GitBranch size={16} />}
						label="Creative Branching"
						onClick={onOpenCreativeBranching} // Attach handler for Creative Branching button
					/>
				</div>
			</div>

			<div className="flex items-center gap-4">
				<span className="text-sm text-gray-600">
					Words: {wordCount}
				</span>
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
function ToolbarButton({ icon, label, onClick, disabled }) {
	const handleClick = (e) => {
		console.log(`ToolbarButton clicked: ${label}`);
		if (onClick && !disabled) {
			onClick(e);
		}
	};
	return (
		<button
			className={`flex items-center text-gray-600 px-3 py-1.5 rounded-full hover:bg-gray-100/50 ${
				disabled ? "opacity-50 cursor-not-allowed" : ""
			}`}
			onClick={handleClick}
			disabled={disabled}
		>
			{icon}
			<span className="mx-1.5">{label}</span>
			<ChevronDown size={16} />
		</button>
	);
}
function Divider() {
	return <div className="w-px h-6 bg-gray-200"></div>;
}
