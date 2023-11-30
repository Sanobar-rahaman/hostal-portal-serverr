const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
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
    // await client.connect();
    const foodCollection = client.db('HostelDb').collection('foodItem')
    const mealCollection = client.db('HostelDb').collection('Meal')
    const memberShipCollection = client.db('HostelDb').collection('memberShip')
    const paymentCollection = client.db('HostelDb').collection('payments')
    const userCollection = client.db('HostelDb').collection('users')
    const comeingMealCollection = client.db('HostelDb').collection('comeingMeal')

    // jwt related API
    app.post('/jwt',async(req,res)=>{
        const user = req.body;
        const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{expiresIn:'1h'});
        res.send({token});
    })
    // verify token
    const verifytoken = (req,res,next)=>{
        // console.log('inside verify token',req.headers.authorization);
        if(!req.headers.authorization){
            return res.status(401).send({message:'forbidden access'});
        }
        const token = req.headers.authorization.split(' ')[1]
        jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
            if(err){
                return res.status(401).send({message:'forbidden access'});
            }
            req.decoded = decoded
            next()
        })
       
    }




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
    
    // TODO: get the add meal and show it to cart user specific
    app.get('/meal',async(req,res)=>{
        const email = req.query.email
        // console.log(email);
        const query = {email:email};
        const result = await mealCollection.find(query).toArray()
        res.send(result)
    })
    //add meal to database
    app.post('/addMeal',async(req,res)=>{
        const meal = req.body
        const result = await mealCollection.insertOne(meal)
        res.send(result)

    })
    // delelete meal from requested meal
    app.delete('/meal/:id',async(req,res)=>{
        const id = req.params.id
        const query = {_id : new ObjectId(id)}
        const result = await mealCollection.deleteOne(query)
        res.send(result)
    })
    // user related API
    app.post('/users',async(req,res)=>{
        const user = req.body;
        //inserted email if user dosent exist
        const query = {email:user.email}
        
        const existingUser = await userCollection.findOne(query)
        if(existingUser){
           return res.send({message:'user already exist',insertedid:null})
        }
        //inserted email if user dosent exist end here
        const result = await userCollection.insertOne(user)
        
        res.send(result);
    })
    app.get('/users',async(req,res)=>{
        
        const result = await userCollection.find().toArray();
        res.send(result)
    })
    app.delete('/users/:id',async(req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)}
        const result = await userCollection.deleteOne(query)
        res.send(result);
    })
   // -------------------------------------------------------------
//    admin related api
app.patch('/users/admin/:id',async(req,res)=>{
    const id = req.params.id
    const filter = {_id: new ObjectId(id)};
    const updatedDoc = {
        $set:{
            role:'admin'
        }
    }
    const result = await userCollection.updateOne(filter,updatedDoc)
    res.send(result);

})
app.get('/users/admin/:email',async(req,res)=>{
    const email = req.params.email
    // if(email!== req.decoded.email){
    //     return res.status(403).send({message: 'unauthorized access'})
    // }

    const query = {email: email};
    const user = await userCollection.findOne(query);
    let admin = false;
    if(user){
        admin = user?.role === 'admin'
    }
    res.send({ admin });

})
    //up comeing meal  related APi
    app.post('/comeingMeal',async(req,res)=>{
        const meal = req.body
        const result = await comeingMealCollection.insertOne(meal)
        res.send(result)

    })
    app.get('/comeingMeal',async(req,res)=>{
        const memberShip = req.body
        const result = await comeingMealCollection.find(memberShip).toArray()
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
    //  now store the payments record to database
    app.post('/payments',async(req,res)=>{
        const payments = req.body
        const result = await paymentCollection.insertOne(payments)
        res.send(result)

    })

    // Send a ping to confirm a successful connectionn
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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