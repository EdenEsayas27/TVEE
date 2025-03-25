const { StatusCodes } = require("http-status-codes")
const jwt = require("jsonwebtoken")
async function authMiddleware(req,res,next){
    const authHeader = req.headers.authorization
    if(!authHeader|| !authHeader.startsWith('Bearer')){
        return res.status(StatusCodes.UNAUTHORIZED).json({msg:"authentication invalid"})
    }
    const token = authHeader.split(' ')[1];
    
    try {
        const {dbusername,userid} = jwt.verify(token,process.env.JWT_SECRET)
        req.user={dbusername,userid}
        next()
    } catch (error) {
        return res.status(StatusCodes.UNAUTHORIZED).json({msg:"Authentication invalid"})
    }
}
module.exports = authMiddleware;