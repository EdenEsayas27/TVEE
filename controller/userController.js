// db connection 
const dbConnection = require("../DB/dbConfig")
const bcrypt = require("bcrypt");
const { StatusCodes } = require("http-status-codes")
const jwt = require("jsonwebtoken")
async function register(req,res){
    //res.send("register")
    const{username,role,field,password,qualificationfile}=req.body;
    if(!username||!role||!field||!password||!qualificationfile){
        return res.status(StatusCodes.BAD_REQUEST).json({msg: "please provide all required fields"})
    }
   try {
        const[user]=await dbConnection.query("select username,userid from users where username = ? ",[username])
        if(user.length >0){
           return res.status(StatusCodes.BAD_REQUEST).json({msg:"user already existed"})
        }
        if(password.length <= 8){
            return res.status(StatusCodes.BAD_REQUEST).json({msg:"password must be atleast 8 characters"})
        }

        //ecrypt the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt)
        await dbConnection.query("INSERT INTO users (username,role,field,password,qualificationfile) VALUES(?,?,?,?,?)",[username,role,field,hashedPassword,qualificationfile] )
        return res.status(StatusCodes.CREATED).json({msg:"user registered sucessfully"})

   } catch (error) {
        console.log(error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:"something went wrong , try again later!"})  
    
   }

}
async function login(req,res){
   const{username,password} = req.body;
   if(!username||!password){
    return res.status(StatusCodes.BAD_REQUEST).json({msg:"please enter all required fields"});
   }
   try {
        const [user] = await dbConnection.query("select userid,username,password from users where username = ?", [username])
        if(user.length==0){
            return res.status(StatusCodes.BAD_REQUEST).json({msg:"invalid credential"})
        }
        //compare password
        const isMatch = await bcrypt.compare(password,user[0].password)
        if(!isMatch){
            return res.status(StatusCodes.BAD_REQUEST).json({msg:"invalid credential"})

      }
        const dbusername = user[0].username;
        const userid = user[0].userid;
        const token = jwt.sign({dbusername , userid},process.env.JWT_SECRET,{expiresIn:"1d"})
        return res.status(StatusCodes.OK).json({msg:"login sucessfully",token})
   } catch (error) {
        console.log(error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:"something went wrong , try again later!"}) 
    
   }
}
async function checkUser(req,res){
    const username = req.user.dbusername
    const userid = req.user.userid
    res.status(StatusCodes.OK).json({msg:"valid user", username , userid })
    
}
module.exports={register,login,checkUser}