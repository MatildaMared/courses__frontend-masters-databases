const { promisify } = require("util");
const express = require("express");
const redis = require("redis");
const client = redis.createClient();

const rIncr = promisify(client.incr).bind(client);

async function init() {
	const app = express();

	app.get("/pageview", async (req, res) => {
		const views = await rIncr("pageviews");
		res
			.json({
				status: "ok",
				views,
			})
			.end();
	});

	const PORT = 3000;
	app.use(express.static("./static"));
	app.listen(PORT, () => {
		console.log(`Server listening on port ${PORT}... 🤩`);
	});
}

init();
