// db connection 
const dbConnection = require("../DB/dbConfig")
const bcrypt = require("bcrypt");
const { StatusCodes } = require("http-status-codes")
const { generateToken } = require("../lib/utils");
const jwt = require("jsonwebtoken");
const cloudinary = require("../lib/cloudinary");
async function register(req,res){
    //res.send("register")
    const{fullname,role,field,password,email}=req.body;
    if(!fullname||!role||!field||!password||!email){
        return res.status(StatusCodes.BAD_REQUEST).json({msg: "please provide all required fields"})
    }
  
   try {
        const[user]=await dbConnection.query("select fullname,email,userid from users where email = ? ",[email])
        if(user.length >0){
           return res.status(StatusCodes.BAD_REQUEST).json({msg:"user already existed"})
        }
        if(password.length < 8){
            return res.status(StatusCodes.BAD_REQUEST).json({msg:"password must be atleast 8 characters"})
        }

        //ecrypt the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt)
        const [result]=await dbConnection.query("INSERT INTO users (fullname,role,field,password,email) VALUES(?,?,?,?,?)",[fullname,role,field,hashedPassword,email] )
        const newUserId = result.insertId;
        generateToken(newUserId, res);
        return res.status(StatusCodes.CREATED).json({
            id: newUserId,
            fullname,    
            role,
            field,
            qualificationfile:"" ,
            email,
            profilepic:"", // default empty or load from DB if set
            });

   } catch (error) {
        console.log(error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:"something went wrong , try again later!"})  
    
   }

}
async function login(req,res){
   const{email,password} = req.body;
   if(!email||!password){
    return res.status(StatusCodes.BAD_REQUEST).json({msg:"please enter all required fields"});
   }
   try {
        const [user] = await dbConnection.query("select userid,fullname,role,field,qualificationfile,email,password,profilepic from users where email = ?", [email])
        if(user.length==0){
            return res.status(StatusCodes.BAD_REQUEST).json({msg:"invalid credential"})
        }
        //compare password
        const isMatch = await bcrypt.compare(password,user[0].password)
        if(!isMatch){
            return res.status(StatusCodes.BAD_REQUEST).json({msg:"invalid credential"})

      }
         // Generate token
        generateToken(user[0].userid, res);

        res.status(200).json({
        id: user[0].userid,
        fullname: user[0].fullname,
        role:user[0].role,
        field:user[0].field,
        qualificationfile:user[0].qualificationfile||"",
        email: user[0].email,
        profilepic: user[0].profilepic || "",
        });
   } catch (error) {
        console.log(error.message);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:"something went wrong , try again later!"}) 
    
   }
}
async function logout(req,res){
  try{
    res.cookie("jwt","",{maxAge:0});
    res.status(200).json({message:"Logged out sucessfully"})

  }
  catch(error){
    console.log("error in logout controller",error.message)
    res.status(500).json({message:"internal server error"})

  }
  
}
//update profile
async function updateProfile(req, res) {
  try {
    const { fullname, password, profilepic } = req.body;
    const userId = req.user.id; // from JWT

    // Fetch current user
    const [userResult] = await dbConnection.query("SELECT * FROM users WHERE userid = ?", [userId]);
    if (userResult.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    let updatedFullname = fullname || userResult[0].fullname;
    let updatedProfilePic = userResult[0].profilepic;
    let updatedPassword = userResult[0].password;

    // If new profile pic is provided
    if (profilepic) {
      const uploadResponse = await cloudinary.uploader.upload(profilepic);
      updatedProfilePic = uploadResponse.secure_url;
    }

    // If new password is provided
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      const salt = await bcrypt.genSalt(10);
      updatedPassword = await bcrypt.hash(password, salt);
    }

    // Update the user
    const [result] = await dbConnection.query(
      "UPDATE users SET fullname = ?, password = ?, profilepic = ? WHERE userid = ?",
      [updatedFullname, updatedPassword, updatedProfilePic, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ message: "No changes were made" });
    }

    // Return updated user (without password)
    const [rows] = await dbConnection.query(
      "SELECT userid AS id, fullname, email, role, field, profilepic FROM users WHERE userid = ?",
      [userId]
    );

    res.status(200).json(rows[0]);

  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
}
// check user 
async function checkUser(req,res){
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("error in check Auth controller",error.message)
    res.status(500).json({message:"internal server error"})
  }
    
}






module.exports={register,login,logout,updateProfile,checkUser}
