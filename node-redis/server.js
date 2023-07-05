const { promisify } = require("util");
const express = require("express");
const redis = require("redis");
const client = redis.createClient();

const rIncr = promisify(client.incr).bind(client);
const rGet = promisify(client.get).bind(client);
const rSetex = promisify(client.setex).bind(client);

function cache(key, ttl, slowFn) {
	return async function cachedFn(...props) {
		const cachedResponse = await rGet(key);
		if (cachedResponse) {
			return cachedResponse;
		}

		const result = await slowFn(...props);
		await rSetex(key, ttl, result);
		return result;
	};
}

async function verySlowAndExpensivePostgresQLQuery() {
	// here you would do a really expensive query to your database
	const promise = new Promise((resolve) => {
		setTimeout(() => {
			resolve(new Date().toISOString());
		}, 10000);
	});
	return promise;
}

const cachedFn = ("expensive_call", 10, verySlowAndExpensivePostgresQLQuery);

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

	app.get("/get", async (req, res) => {
		const response = await cachedFn();
		res
			.json({
				status: "ok",
        data: response,
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
