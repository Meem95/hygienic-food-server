const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());



console.log(process.env.DB_USER);
console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.52gi70p.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
console.log(uri);

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();
 
    const userCollection = client.db('foodDB').collection('user');
    const foodCollection = client.db("foodDB").collection("food");
  
    //Food related routes 
    //Food get route
    app.get("/food", async (req, res) => {
      const cursor = foodCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //post route
    app.post("/food", async (req, res) => {
      const newLocation = req.body;
      console.log(newLocation);
      const result = await foodCollection.insertOne(newLocation);
      res.send(result);
    });
     //my list route
     app.get("/myFood/:email", async (req, res) => {
      console.log(req.params.email);
      const result = await foodCollection.find({ email: req.params.email }).toArray();
      res.send(result)
    })


    app.get("/food/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });
 //update route
 app.put("/food/:id", async (req, res) => {
  const id = req.params.id;
  const filter = { _id: new ObjectId(id) };
  const options = { upsert: true };
  const updatedFood = req.body;

  const location = {
    $set: {
      
      food_name: updatedFood.food_name,
      quantity: updatedFood.quantity,
      status: updatedFood.status,
      location: updatedFood.location,
      image: updatedFood.image,
      date: updatedFood.date,
      short_description: updatedFood.short_description,
    },
  };

  const result = await foodCollection.updateOne(
    filter,
    location,
    options
  );
  res.send(result);
});

    //delete method
    app.delete("/food/:id", async (req, res) => {
      const id = req.params.id;
      console.log("delete from database", id);
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    });
    // user related apis
   
    app.get('/user', async (req, res) => {
      const cursor = userCollection.find();
      const users = await cursor.toArray();
      res.send(users);
  })

  app.post('/user', async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await userCollection.insertOne(user);
      res.send(result);
  });

  app.patch('/user', async (req, res) => {
      const user = req.body;
      const filter = { email: user.email }
      const updateDoc = {
          $set: {
              lastLoggedAt: user.lastLoggedAt
          }
      }
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
  })

  

    

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Food service server is running");
});

app.listen(port, () => {
  console.log(`Food service is running on port: ${port}`);
});
