require("dotenv").config(); // Load environment variables
const express = require("express");
const app = express();
const port = 5500;

// db connection
const dbConnection = require("./DB/dbConfig")

app.get('/',(req,res)=>{
    res.send("wellcome")
})
//user routes middleware file
const userRoutes = require("./routes/userRoute")

//json middleware to extract json data
app.use(express.json())
//user route middleware
app.use("/api/users",userRoutes)

async function start(){
try {
   const result = await dbConnection.execute("select 'test'")
   app.listen(port);
   console.log("database connection established");
   console.log(`listening on port ${port}`);
   //console.log(result)
} catch (error) {
    console.log(error.message);
}
}
start();
