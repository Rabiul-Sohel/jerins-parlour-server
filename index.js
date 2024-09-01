const express = require('express')
const app = express()
const port = process.env.PORT || 5000

app.get('/', (req, res)=>{
    res.send('Parlour is here')
})
app.listen(port,()=>{
    console.log(`parlour is running on port ${port}`);
})