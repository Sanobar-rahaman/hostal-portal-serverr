const express = require('express');
const cors = require('cors');
const app = express()
require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5001


// middlewere
app.use(cors())
app.use(express.json())



 const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6q5hueg.mongodb.net/?retryWrites=true&w=majority`;

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
    const foodCollection = client.db('HostelDb').collection('foodItem')
    const mealCollection = client.db('HostelDb').collection('Meal')
    const memberShipCollection = client.db('HostelDb').collection('memberShip')
    const paymentCollection = client.db('HostelDb').collection('payments')

    //foodItem related API
    app.get('/foodItems',async(req,res)=>{
        const foodItem = req.body
        const result = await foodCollection.find(foodItem).toArray()
        res.send(result)
    })
    // food details API
    app.get('/detailsFood/:id',async(req,res)=>{
        const id = req.params.id;
        const query ={_id : new ObjectId(id)}
        const result = await foodCollection.findOne(query)
        res.send(result)

    })
    //add meal to database
    app.post('/addMeal',async(req,res)=>{
        const meal = req.body
        const result = await mealCollection.insertOne(meal)
        res.send(result)

    })
    // memberShip related api
    app.get('/memberShip',async(req,res)=>{
        const memberShip = req.body
        const result = await memberShipCollection.find(memberShip).toArray()
        res.send(result)
    })
    // payment related API
    app.post('/create-payment-intent',async(req,res)=>{
        try{ const{ price } = req.body;
         const amount = parseInt(price * 100);
        //  console.log('amout inside',amount);
         // console.log(amount ,'amout in the entent');
         const paymentIntent = await stripe.paymentIntents.create({
             amount:amount,
             currency: 'usd',
             payment_method_types: ['card']
 
 
         });
         res.send({
            clientSecret:paymentIntent.client_secret
         
         })}
         catch(error){
             res.send(error)
         }
 
     })
    //  now store yhe payments record to database
    app.post('/payments',async(req,res)=>{
        const payments = req.body
        const result = await paymentCollection.insertOne(payments)
        res.send(result)

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




app.get('/',(req,res)=>{
    res.send('Hostel Manegement System is Running')
})
app.listen(port,()=>{
    console.log(`Hostel Manegement System is Running on port ${port}`);
})