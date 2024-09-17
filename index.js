const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const Stripe = require('stripe')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const sslCommerz = require('sslcommerz-lts');
const SSLCommerzPayment = require('sslcommerz-lts');
// const router = express.Router()

const store_Id = process.env.SSL_STORE_ID
const store_pass = process.env.SSL_STORE_PASS
const is_live = false

const port = process.env.PORT || 5000
const stripe = Stripe(process.env.STRIPE_SECRET_KEY)



app.use(cors({
    origin: ['http://localhost:5173', 'https://sandbox.sslcommerz.com'],
    credentials: true,
    optionSuccessStatus:200
}))
app.use(bodyParser.json())
app.use(express.json())
app.use(cookieParser())

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']


    //  const token = authorizations[1]
    if (!token) {
        res.status(401).send({ message: 'Unauthorized access' })
    } else {

        jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
            if (err) {

                res.status(401).send({ message: 'Unauthorized access' })
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
        const serviceCollection = client.db('jerinsParlour').collection('sevices')
        const orderCollection = client.db('jerinsParlour').collection('orders')
        const reviewCollection = client.db('jerinsParlour').collection('reviews')

        // jwt token
        app.post('/jwt', async (req, res) => {
            const email = req.body.email
            const token = jwt.sign({ email }, process.env.TOKEN_SECRET, { expiresIn: '2h' })
            res.send({ token })
            //    res.cookie('access-token', token).send({message: 'cookie set successfully'})
        })
        // app.post('/initiate-payment', async (req, res) => {
        //     // console.log(req.body);
        //     const tran_id = new ObjectId().toString()
        //     const service = await serviceCollection.findOne({_id: new ObjectId(req.body.service_id)})
        //     // console.log(service);
        //     const data = {
        //         total_amount: service.price,
        //         currency: 'BDT',
        //         tran_id: tran_id, // use unique tran_id for each api call
        //         success_url: `http://localhost:5000/payment/success/${tran_id}`,
        //         fail_url: `http://localhost:5000/payment/fail/${tran_id}`,
        //         cancel_url: 'http://localhost:3030/cancel',
        //         ipn_url: 'http://localhost:3030/ipn',
        //         shipping_method: 'Courier',
        //         product_name: service.title,
        //         product_category: 'Electronic',
        //         product_profile: 'general',
        //         cus_name: req.body.customer_name,
        //         cus_email: req.body.customer_email,
        //         cus_add1: 'Dhaka',
        //         cus_add2: 'Dhaka',
        //         cus_city: 'Dhaka',
        //         cus_state: 'Dhaka',
        //         cus_postcode: '1000',
        //         cus_country: 'Bangladesh',
        //         cus_phone: '01711111111',
        //         cus_fax: '01711111111',
        //         ship_name: 'Customer Name',
        //         ship_add1: 'Dhaka',
        //         ship_add2: 'Dhaka',
        //         ship_city: 'Dhaka',
        //         ship_state: 'Dhaka',
        //         ship_postcode: 1000,
        //         ship_country: 'Bangladesh',
        //     };
        //     // console.log(data);
        //     const sslcz = new SSLCommerzPayment(store_Id, store_pass, is_live)
        //     // console.log(data);
        //     sslcz.init(data)
        //         .then(response => {
        //             const GatewayPageURL = response.GatewayPageURL
        //             // console.log('redirecting to', GatewayPageURL, response);
        //             res.send(GatewayPageURL)
        //             const finalOrder = {
        //                 service, 
        //                 paidStatus: false,
        //                 transactionId: tran_id
        //             }
        //             const result = orderCollection.insertOne(finalOrder)
                    
        //         })



        // })

        // app.post('/payment/success/:tranId', async(req, res)=>{
        //     console.log(req.params.tranId);
        //     const result = await orderCollection.updateOne({transactionId: req.params.tranId},{
        //         $set:{
        //             paidStatus: true
        //         }
        //     })
        //     if(result.modifiedCount > 0){
        //         res.redirect(`http://localhost:5173/payment/success/${req.params.tranId}`)
        //     }

        // })
        // app.post('/payment/fail/:tranId', async(req, res)=>{
        //     const result = await orderCollection.deleteOne({transactionId: req.params.tranId })
        //     if(result.deletedCount){
        //         res.redirect(`http://localhost:5173/payment/fail/${req.params.tranId}`)
        //     }
        // })

        app.post('/payment-initiate', async(req, res)=>{
            const order = req.body
            const tranId = new ObjectId().toString()
            const storeId = process.env.SSL_STORE_ID
            const storePassword = process.env.SSL_STORE_PASS
            const isLive = false 
            const service = await serviceCollection.findOne({_id: new ObjectId(req.body.serviceId)})
            console.log(service);
            const data = {
                total_amount: service.price,
                currency: 'USD',   
                tran_id: tranId , // use unique tran_id for each api call
                success_url: `http://localhost:5000/payment/success/${tranId}`,
                fail_url: `http://localhost:5000/payment/fail/${tranId}`,
                cancel_url: 'http://localhost:3030/cancel',
                ipn_url: 'http://localhost:3030/ipn',
                shipping_method: 'Courier',
                product_name: 'Computer.',
                product_category: 'Electronic',
                product_profile: 'general',
                cus_name: order.customerName,
                cus_email: order.customerEmail,
                cus_add1: 'Dhaka',
                cus_add2: 'Dhaka',
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: '01711111111',
                cus_fax: '01711111111',
                ship_name: 'Customer Name',
                ship_add1: 'Dhaka',
                ship_add2: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',
            };
            const sslcz = new SSLCommerzPayment(storeId, storePassword, isLive)
            sslcz.init(data).then(apiResponse =>{
                console.log(apiResponse.GatewayPageURL);
                const GatewayPageURL = apiResponse.GatewayPageURL
                res.send({url:GatewayPageURL})
                const finalOrder = {
                    service,
                    paidStatus: false,
                    transactionId: tranId
                }
                const result = orderCollection.insertOne(finalOrder)
            })
            console.log(data);  
        })

        app.post('/payment/success/:tranId', async(req, res)=>{
            const tranId = req.params.tranId
            const result = await orderCollection.updateOne({transactionId: tranId}, {
                $set: {
                    paidStatus: true 
                }
            })
            if(result.modifiedCount > 0){
                res.redirect(`http://localhost:5173/payment/success/${tranId}`)
            }
            console.log();
        })

        app.post('/payment/fail/:tranId', async(req, res) =>{
            const tranId = req.params.tranId
            const result = await orderCollection.deleteOne({transactionId: tranId})
            if(result.deletedCount){
                res.redirect(`http://localhost:5173/payment/fail/${tranId}`)
            }

            console.log(result);
        })

        // stripe related
        app.post('/create-payment-intent', async (req, res) => {
            const { amount } = req.body
            // const stripeAmount = amount * 100
            // console.log(amount * 100);
            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency: 'usd',
                // payment_method_types: ['card']   
            })

            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })

        // user related api
        app.post('/users', async (req, res) => {
            const user = req.body
            const query = { email: user.email }

            const existingUser = await userCollection.findOne(query)
            // console.log(existingUser);
            if (existingUser) {
                res.send({ message: 'User already exist' })
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
        app.patch('/users/:email', verifyToken, async (req, res) => {
            const email = req.params.email
            const filter = { email: email }
            const updatedDoc = {
                $set: {
                    isAdmin: true
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc)
            res.send(result)

        })
        app.get('/singleUser', verifyToken, async (req, res) => {
            const userEmail = req.user.email
            const email = req.query.email
            if (email !== userEmail) {
                return res.status(403).send({ message: 'Forbidden' })
            }
            // console.log(userEmail, 'from singleUser');
            const query = { email: email }
            const result = await userCollection.findOne(query)
            res.send(result)
        })

        //  service related api
        app.post('/services', async (req, res) => {
            const service = req.body;
            const result = await serviceCollection.insertOne(service)
            res.send(result)
        })
        app.get('/services', async (req, res) => {
            const result = await serviceCollection.find().toArray()
            res.send(result)
        })

        // review related api 
        app.post('/reviews', async (req, res) => {
            const data = req.body
            // console.log(data);
            const result = await reviewCollection.insertOne(data)
            res.send(result)
        })
        app.get('/reviews', async (req, res) => {
            const result = await reviewCollection.find().toArray()
            res.send(result)
        })

        // order related api
        app.post('/orders', async (req, res) => {
            const order = req.body
            const result = await orderCollection.insertOne(order)
            res.send(result);
        })
        app.get('/orders', async (req, res) => {
            const result = await orderCollection.find().toArray()
            res.send(result)
        })
        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id
            const { status } = req.body
            const filter = { _id: new ObjectId(id) }
            const updatedDoc = {
                $set: {
                    status: status
                }
            }
            const result = await orderCollection.updateOne(filter, updatedDoc)
            res.send(result)
        })
        app.get('/bookings', verifyToken, async (req, res) => {
            const userEmail = req.user.email
            console.log(userEmail, 'from bookings');
            const email = req.query.email
            if (email !== userEmail) {
                return res.status(403).send({ message: 'Forbidden' })
            }
            const query = { customerEmail: email }
            const result = await orderCollection.find(query).toArray()
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