const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000 ;


// middleware 
app.use(cors())
app.use(express.json())

app.get('/', ( req , res ) =>{
     res.send('cars-doctors-running')
})

// mongodb start
 
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.kri1sc7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyJWT = ( req , res , next ) =>{
      const authorization = req.headers.authorization ;
      if(!authorization){
         return res.status(401).send({error: true , message : 'unauthorize access'})
      }
      const token = authorization.split(' ')[1];
      jwt.verify( token , process.env.SECRET_TOKEN , (error , decoded ) =>{
         if(error){
            return  res.status(403).send({error : true , message : "unauthorize access"})
         }
         req.decoded = decoded ;
         next();
      })

}



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const serviceCollection = client.db("carsDoctor").collection("services");
    const bookingCollection = client.db("carsDoctor").collection("booking");
    
    // jwt 
    app.post('/jwt' , async  ( req , res ) =>{
        const user = req.body ;
        console.log(user);
        const token = jwt.sign(user , process.env.SECRET_TOKEN , {
          expiresIn : '1h'
        }) 
        res.send({token})
    })





    // service 
     app.get('/services' , async ( req , res ) => {
          const cursor =  serviceCollection.find();
          const result = await cursor.toArray();
          res.send(result)
     })
    
     app.get('/services/:id' , async ( req , res ) =>{
          const id = req.params.id;
          const query = {_id : new ObjectId(id)}

          const options = {

            projection: { title: 1, service_id: 1 , price: 1 , img : 1},

          };


          const result = await serviceCollection.findOne(query , options)
          res.send(result)
     })

    //  booking 
     app.get('/booking' , verifyJWT , async(req , res )=>{
        const decoded = req.decoded;
        if(decoded.email !== req.query.email){
           return res.status(403).send({error : 1 , message:'forbidden access' })
        }

         let query = {}
         if (req.query?.email){
           query = {email : req.query?.email }
         }
         const result = await bookingCollection.find(query).toArray()
         res.send(result)
     })
     app.post('/booking' , async( req , res ) => {
          const bookedData = req.body ;
          const result = await bookingCollection.insertOne(bookedData)
          res.send( result )
     })
     app.patch('/booking/:id' , async ( req , res ) =>{
          const id = req.params.id ;
          const filter = {_id : new ObjectId(id)}
          const updatedBooking = req.body ;
          const updateDoc = {
            $set: {
               status : updatedBooking.status
            },
          };
         
          const result = await bookingCollection.updateOne( filter , updateDoc)
          res.send(result)
     } )
     
     app.delete('/booking/:id' , async (req , res )=>{
         const id = req.params.id ;
         const query = { _id : new ObjectId(id)}
         const result = await bookingCollection.deleteOne(query)
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

// mongodb end 







app.listen(port , ()=>{
     console.log('car doctor app running on port ' + {port});
})