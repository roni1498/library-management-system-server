const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware
app.use(cors({
  origin: [
    'http://localhost:5173'
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser())

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

// middleware
const logger = (req, res, next)=>{
  console.log('log: info',req.method, req.url);
  next();
}

const verifyToken = (req, res, next)=>{
  const token = req?.cookies?.token;
  // console.log('token in the middleware', token);
  // if no token available
  if(!token){
    return res.status(401).send({message: 'Unauthorized Access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({message: 'Unauthorized Access'});
    }
    req.user = decoded;
    next()
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const bookCategoryCollection = client.db("bookCategory").collection("category");
    const bookCollection = client.db("bookDB").collection("Book");
    const borrowBookCollection = client.db("bookDB").collection("borrowBook");

    console.log(process.env.ACCESS_TOKEN_SECRET)
    // auth related api
    app.post('/jwt', logger, async(req, res)=>{
        const user = req.body;
        console.log('user for token', user)
        const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
        res.cookie('token', token, { 
          httpOnly: true,
          secure: true,
          sameSite: 'none'
        })
        .send({success: true})
    })
    
    app.post('/logout', async(req, res) =>{
      const user = req.body;
      console.log('logging out', user)
      res.clearCookie('token', {maxAge: 0}).send({success: true})
    })


    // book related api

    // borrow Book
    app.post('/borrowBook', async(req, res)=>{
      const borrowBook = req.body;
      const result = await borrowBookCollection.insertOne(borrowBook);
      res.send(result);
    })

    app.get('/borrowBook', logger, verifyToken, async(req, res)=>{
      console.log(req.query.email);
      console.log('token owner info', req.user)
      if(req.user.email !== req.query.email){
        return res.status(403).send({message: 'Forbidden Access'}) 
      }
      let query = {}
      if(req.query?.email){
        query = {email: req.query.email}
      }
      const cursor = borrowBookCollection.find(query);
      const result = await cursor.toArray()
      res.send(result);
    })

    app.delete("/borrowBook/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await borrowBookCollection.deleteOne(query);
      res.send(result);
    });


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

    //   for show book by category
      app.get("/book/:category", async (req, res) => {
        const category = req.params.category;
        const cursor = bookCollection.find({ category: category });
        const result = await cursor.toArray();
        res.send(result);
      });

    //   for show book details
    app.get("/single-book/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await bookCollection.findOne(query);
        res.send(result);
      });

      app.put("/single-book/:id", async (req, res) =>{
        const id = req.params.id;
        const filter = { _id: new ObjectId(id)};
        const options = { upsert: true };
        const updateBook = req.body
        const book = {
          $set: {
            bookName: updateBook.bookName, 
            quantity: updateBook.quantity, 
            authorName: updateBook.authorName, 
            category: updateBook.category, 
            description: updateBook.description, 
            rating: updateBook.rating, 
            image: updateBook.image
          }
        }
        const result = await bookCollection.updateOne(filter, book, options);
        res.send(result)
      })

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

