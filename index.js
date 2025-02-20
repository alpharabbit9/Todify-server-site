const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());



const uri = "mongodb+srv://Todify:wWn6nB8JLhzL47fr@cluster0.chblh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

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
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

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

        app.get('/tasks' , async (req , res) =>{
            const email = req.query.email;

            if(!email)
            {
                return res.status(400).json({message: "User email is required"});
            }

            const tasks = await taskCollection.find({email}).toArray();

            res.send(tasks);
        })




        // Add Task including email
        app.post('/tasks', async (req, res) => {
            const { title, description, email } = req.body;

            if (!email) {
                return res.status(400).json({ message: "Email required" });
            }

            const newTask = {

                title,
                description,
                status: "TODO",
                email,
                createdAt: new Date()
            }

            const result = await taskCollection.insertOne(newTask);

            res.send(result);

        })


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