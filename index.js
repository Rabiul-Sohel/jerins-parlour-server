const express = require('express')
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000

app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const verifyToken = (req, res, next) =>{
const authorization = req.headers['authorization']

 
//  const token = authorizations[1]
 if(!authorization){
    res.status(401).send({message: 'Unauthorized access'})
 } else {
    const token = authorization.split(' ')[1]  
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded)=>{
        if(err){
            console.log(err, err);
            res.status(401).send({message: 'Unauthorized access'})
        } else {
            // console.log(decoded, 'decoded');
            req.user = decoded;
            next()
        }
    })
 }

  
    
}
// console.log(process.env.DB_USER);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ndy3clf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

        const userCollection = client.db('jerinsParlour').collection('users')

        // jwt token
        app.post('/jwt', async(req, res)=>{
            const email = req.body.email
            const token = jwt.sign({email}, process.env.TOKEN_SECRET,{expiresIn: '2h'})
            res.send({token})
        //    res.cookie('access-token', token).send({message: 'cookie set successfully'})
        })
  
        // user related api
        app.post('/users', async (req, res) => {
            const user = req.body
            const query = { email: user.email }

            const existingUser = await userCollection.findOne(query)
            console.log(existingUser);
            if (existingUser) {
                res.send({message:'User already exist'})
            } else {
                const result = await userCollection.insertOne(user)
                res.send(result)
            }


        })
        app.get('/users', verifyToken, async (req, res) => {
            const userEmail = req.user.email
            // console.log(userEmail, 'users api');
            const result = await userCollection.find().toArray()
            res.send(result)
        }) 
        app.patch('/users/:email', async(req, res)=>{
            const email = req.params.email 
            const filter = {email: email}
            const updatedDoc = {
                $set:{
                    isAdmin: true
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc)
            res.send(result)
             
        })
        app.get('/singleUser', async(req, res)=>{
            const email = req.query.email
            console.log(email);
            const query = {email: email}
            const result = await userCollection.findOne(query)
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


app.get('/', (req, res) => {
    res.send('Parlour is here')
})
app.listen(port, () => {
    console.log(`parlour is running on port ${port}`);
})