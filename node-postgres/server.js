const { express } = require("express");
const { Pool } = require("pg");

const pool = new Pool({
	connectionString:
		"postgresql://postgres:mysecretpassword@localhost:5432/message_boards",
});

async function init() {
	const app = express();

	app.get("/get", async (req, res) => {
		const client = await pool.connect();

		const [commentResponse, boardResponse] = await Promise.all([
			client.query(
				"SELECT * FROM comments NATURAL LEFT JOIN rich_content WHERE board_id = $1",
				[req.query.search]
			),
			client.query("SELECT * FROM boards WHERE board_id = $1", [
				req.query.search,
			]),
		]);

		res.json({
			status: "ok",
			board: boardResponse.rows[0] || {},
			posts: commentResponse.rows || [],
		});

		const PORT = 3000;

		app.use(express.static("./static"));

		app.listen(PORT, () => {
			console.log(`Listening on port ${PORT}`);
		});
	});
}

init();
