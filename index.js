const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

// middleware
app.use(cors());
app.use(express.json());

// mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vyh864y.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri)

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
    await client.connect();

    const bookCategoryCollection = client.db("bookCategory").collection("category");
    const bookCollection = client.db("bookDB").collection("Book");

    // book server
    app.post('/book', async(req, res)=>{
        const newBook = req.body;
        console.log(newBook)
        const result = await bookCollection.insertOne(newBook);
        res.send(result);
    })

    app.get("/book", async (req, res) => {
        const cursor = bookCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      });

    // get book category data
    app.get('/category', async(req, res)=>{
        const cursor = await bookCategoryCollection.find().toArray();
        res.send(cursor)
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get("/", (req, res) => {
    res.send("Library management system Server is Running");
  });
  
  app.listen(port, () => {
    console.log(`Library management system Server is Running on Port: ${port}`);
  });

