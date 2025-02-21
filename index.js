const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

console.log(process.env.DB_USER)


const uri = `mongodb+srv://Todify:wWn6nB8JLhzL47fr@cluster0.chblh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const userCollection = client.db('TodifyDB').collection('users');
        const taskCollection = client.db('TodifyDB').collection('tasks');


        // Get users
        app.get('/users', async (req, res) => {
            const cursor = userCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        // Add Users
        app.post('/users', async (req, res) => {
            const user = req.body;

            const query = { email: user.email };
            const existingUser = await userCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: 'user already exist', insertedId: null });
            }


            const result = await userCollection.insertOne(user);
            res.send(result);

        })
        // Get task filtering Email

        app.get('/tasks', async (req, res) => {
            const email = req.query.email;  // Get email from query
            if (!email) return res.status(400).json({ error: "Email is required" });
        
            try {
                const tasks = await taskCollection.find({ email }).toArray();  // Filter by email
                res.json(tasks);
            } catch (error) {
                console.error("Error fetching tasks:", error);
                res.status(500).json({ error: "Internal Server Error" });
            }
        });



        // Add Task including email
        app.post('/tasks', async (req, res) => {
            const { title, description, email, category } = req.body;

            if (!title || !email || !category) {
                return res.status(400).json({ message: "Title, email, and category are required" });
            }

            if (title.length > 50 || (description && description.length > 200)) {
                return res.status(400).json({ message: "Title or description exceeds character limit" });
            }

            const newTask = {
                title,
                description: description || "",
                email,
                category, // To-Do, In Progress, or Done
                timestamp: new Date(),
                position: 0  // Default position
            };

            const result = await taskCollection.insertOne(newTask);
            res.status(201).json(result);
        });

        // Update Task

        app.put('/tasks/:id', async (req, res) => {
            const { id } = req.params;
            const { title, description, category } = req.body;

            if (title && title.length > 50) {
                return res.status(400).json({ message: "Title exceeds 50 characters" });
            }
            if (description && description.length > 200) {
                return res.status(400).json({ message: "Description exceeds 200 characters" });
            }

            const updateFields = {};
            if (title) updateFields.title = title;
            if (description) updateFields.description = description;
            if (category) updateFields.category = category;

            const result = await taskCollection.updateOne(
                { _id: new ObjectId(id) },
                { $set: updateFields }
            );

            res.json(result);
        });

        // Delete Task 
        app.delete('/tasks/:id', async (req, res) => {
            const { id } = req.params;

            const result = await taskCollection.deleteOne({ _id: new ObjectId(id) });

            if (result.deletedCount === 0) {
                return res.status(404).json({ message: "Task not found" });
            }

            res.json({ message: "Task deleted successfully" });
        });

        // Re-render task after DnD

        app.put('/tasks/reorder', async (req, res) => {
            const { taskId, newCategory, newPosition } = req.body;
        
            const result = await taskCollection.updateOne(
                { _id: new ObjectId(taskId) },
                { $set: { category: newCategory, position: newPosition } }
            );
        
            res.json(result);
        });




    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Life Overloaded With Tasks');
})

app.listen(port, () => {
    console.log(`Reporting from port : ${port}`)
})