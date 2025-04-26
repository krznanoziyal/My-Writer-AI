import React from "react";

export default function StoryContextPanel({ context, setContext, onClose }) {
	return (
		<div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg relative">
				<button
					className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
					onClick={onClose}
					aria-label="Close"
				>
					×
				</button>
				<h2 className="text-xl font-semibold mb-4">Story Context</h2>
				<form className="space-y-3">
					<ContextField
						label="Genre"
						value={context.genre}
						onChange={(v) =>
							setContext((c) => ({ ...c, genre: v }))
						}
					/>
					<ContextField
						label="Style"
						value={context.style}
						onChange={(v) =>
							setContext((c) => ({ ...c, style: v }))
						}
					/>
					<ContextField
						label="Synopsis"
						value={context.synopsis}
						onChange={(v) =>
							setContext((c) => ({ ...c, synopsis: v }))
						}
						textarea
					/>
					<ContextField
						label="Characters"
						value={context.characters}
						onChange={(v) =>
							setContext((c) => ({ ...c, characters: v }))
						}
						textarea
					/>
					<ContextField
						label="Worldbuilding"
						value={context.worldbuilding}
						onChange={(v) =>
							setContext((c) => ({ ...c, worldbuilding: v }))
						}
						textarea
					/>
					<ContextField
						label="Outline"
						value={context.outline}
						onChange={(v) =>
							setContext((c) => ({ ...c, outline: v }))
						}
						textarea
					/>
					<ContextField
						label="Target Audience Age"
						value={context.target_audience_age}
						onChange={(v) =>
							setContext((c) => ({
								...c,
								target_audience_age: v,
							}))
						}
					/>
				</form>
				<div className="flex justify-end mt-4">
					<button
						className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600"
						onClick={onClose}
						type="button"
					>
						Done
					</button>
				</div>
			</div>
		</div>
	);
}

function ContextField({ label, value, onChange, textarea }) {
	return (
		<div>
			<label className="block text-sm font-medium text-gray-700 mb-1">
				{label}
			</label>
			{textarea ? (
				<textarea
					className="w-full border rounded px-2 py-1 text-sm"
					rows={2}
					value={value}
					onChange={(e) => onChange(e.target.value)}
				/>
			) : (
				<input
					className="w-full border rounded px-2 py-1 text-sm"
					value={value}
					onChange={(e) => onChange(e.target.value)}
				/>
			)}
		</div>
	);
}
