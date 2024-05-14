const {
  MongoClient,
  ServerApiVersion,
  ObjectId
} = require("mongodb");
const express = require("express");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    // 'https://cars-doctor-6c129.web.app',
    // 'https://cars-doctor-6c129.firebaseapp.com'
  ],
  credentials: true
}));
app.use(cookieParser());
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

// middlewares
const logger = async (req, res, next) => {
  console.log('called:', req.host, req.originalUrl)
  next();
}

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log('allah bachao',token)
  if (!token) {
      return res.status(401).send({ message: 'unauthorized access' })
      next();
  }
  // jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
  //     if (err) {
  //         return res.status(401).send({ message: 'unauthorized access' })
  //     }
  //     req.user = decoded;
  //     next();
  // })
}



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();

    const userCollection = client.db('foodDB').collection('user');
    const foodCollection = client.db("foodDB").collection("food");

    // user related apis
    app.post('/jwt',logger, async (req, res) => {
      const user = req.body;
      console.log('user for token', user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '1h'
      });

      res.cookie('token', token, {
          httpOnly: true,
          secure: false,
          sameSite: 'none'
        })
        .send({
          success: true
        });
    })
    //Food related routes 


    //my list route
    app.get("/myFood/:email", async (req, res) => {
      console.log(req.params.email);
      console.log("token", req.cookies.token);

      const result = await foodCollection.find({
        email: req.params.email
      }).toArray();
      res.send(result)

      // let query = {};
      // if (req.query?.email) {
      //     query = { email: req.query.email }
      // }
      // const result = await foodCollection.find(query).toArray();
      // res.send(result);

      
    })


    //Food get route
    app.get("/food",logger, async (req, res) => {
      const cursor = foodCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //post route
    app.post("/food",logger, async (req, res) => {
      const newLocation = req.body;
      console.log(newLocation);
      const result = await foodCollection.insertOne(newLocation);
      res.send(result);
    });




    app.get("/food/:id",logger, async (req, res) => {
      const id = req.params.id;
      const query = {
        _id: new ObjectId(id)
      };
      const result = await foodCollection.findOne(query);
      res.send(result);
    });
    //update route
    app.put("/food/:id", logger,async (req, res) => {
      const id = req.params.id;
      const filter = {
        _id: new ObjectId(id)
      };
      const options = {
        upsert: true
      };
      const updatedFood = req.body;

      const food = {
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
        food,
        options
      );
      res.send(result);
    });

    //delete method
    app.delete("/food/:id", async (req, res) => {
      const id = req.params.id;
      console.log("delete from database", id);
      const query = {
        _id: new ObjectId(id)
      };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    });




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
      const filter = {
        email: user.email
      }
      const updateDoc = {
        $set: {
          lastLoggedAt: user.lastLoggedAt
        }
      }
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    })





    // Send a ping to confirm a successful connection
    await client.db("admin").command({
      ping: 1
    });
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