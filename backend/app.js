require("dotenv").config(); // Load environment variables
const express = require("express");
const cookieParser = require("cookie-parser");
const  cors= require("cors");
const port = 5500;
// const path = require("path");

// db connection
const dbConnection = require("./DB/dbConfig")


//user routes middleware file
const userRoutes = require("./routes/user.Route.js")
const messageRoutes = require("./routes/message.route.js")
const questionRoutes = require("./routes/question.route.js")
const answerRoutes = require("./routes/answer.routes.js")
const requestRoute = require("./routes/request.route.js")
const scheduleRoute = require("./routes/schedule.route.js")
const notificationRoute = require("./routes/notification.routes.js")
const resourceRoute = require("./routes/resources.route.js")
const instructorRoute = require("./routes/instructors.route.js")
const groupRoute = require("./routes/group.route.js")
const qualificationFileRoute = require("./routes/qualificationFile.route.js")
// const googleMeetRoute = require("./routes/googleMeet.route.js")
const rateInstructorRoute = require("./routes/rateInstructor.route.js")
const{ app, server } = require( "./lib/socket.js");


const { initGoogleAuth } = require('./controller/googleMeet.controller.js');
const open = (...args) => import('open').then(module => module.default(...args));


// const __dirname = path.resolve();
//json middleware to extract json data
app.use(express.json())
app.use(cookieParser());
//user route middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use("/api/users",userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/questions",questionRoutes);
app.use("/api/answers",answerRoutes);
app.use("/api/requests",requestRoute);
app.use("/api/schedules",scheduleRoute);
app.use("/api/notifications",notificationRoute);
app.use("/api/resources",resourceRoute);
app.use("/api/instructors",instructorRoute);
app.use("/api/instructors",instructorRoute);
app.use("/api/groups",groupRoute);
app.use("/api/qualificationFiles",qualificationFileRoute);
// app.use("/api/googleMeet",googleMeetRoute);
app.use("/api/rateInstructor",rateInstructorRoute);

//deployment code will be written here 

async function start(){
try {
   const result = await dbConnection.execute("select 'test'")
  
   console.log("database connection established");

   initGoogleAuth((authClient, oAuth2Client) => {
  if (!authClient && oAuth2Client) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar'],
    });
    console.log('🔑 Authorize this app by visiting this url:', authUrl);
    open(authUrl); // Automatically open browser
  }
});

   server.listen(port);
   console.log(`listening on port ${port}`);
   //console.log(result)
} catch (error) {
    console.log(error.message);
}
}
start();
