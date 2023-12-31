const express = require("express");
const neo4j = require("neo4j-driver");

const connectionString = "bolt://localhost:7687";

const driver = neo4j.driver(connectionString);

async function init() {
	const app = express();

	app.get("/get", async (req, res) => {
		const session = driver.session();

		const result = await session.run(
			`
        MATCH path = shortestPath(
            (First:Person {name: $person1 })-[*]-(Second:Person {name: $person2 })
        )
        UNWIND nodes(path) as node
        RETURN coalesce(node.name, node.title) as text;
    `,
			{
				person1: req.query.person1,
				person2: req.query.person2,
			}
		);

		res
			.json({
				status: "ok",
				path: result.records.map((record) => record.get("text")),
			})
			.end();

		await session.close();
	});

	app.use(express.static("./static"));

	const PORT = 3000;

	app.listen(PORT, () => {
		console.log(`Server is listening on port ${PORT}`);
	});
}

init();
