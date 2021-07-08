update-fukui:
	deno run -A ./fukui/update.ts
	deno run -A ./kitakyusyu/update.ts
	deno run -A ./kumamoto/update-yatsushiro.ts
	deno run -A ./nagaoka/update.ts
