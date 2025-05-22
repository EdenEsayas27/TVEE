CREATE TABLE users(
    userid INT(20) NOT NULL AUTO_INCREMENT,
    fullname VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    field VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL ,
    qualificationfile TEXT  DEFAULT '',
    email VARCHAR(100) NOT NULL,
    profilePic TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    PRIMARY KEY(userid)
);

CREATE TABLE messages (
    messageId INT AUTO_INCREMENT PRIMARY KEY,
    senderId INT NOT NULL,
    receiverId INT NOT NULL,
    text TEXT,
    image VARCHAR(255),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (senderId) REFERENCES users(userid),
    FOREIGN KEY (receiverId) REFERENCES users(userid)
);

CREATE TABLE IF NOT EXISTS questions (
    id INT(40) AUTO_INCREMENT,
    question_id VARCHAR(255) NOT NULL UNIQUE,
    user_id INT(20) NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    question Text ,
    description TEXT NOT NULL,
    tag VARCHAR(255) NOT NULL,
    image VARCHAR(255),         -- Optional image URL/path
    voice VARCHAR(255),         -- Optional voice file URL/path

    PRIMARY KEY (id, question_id),
    FOREIGN KEY (user_id) REFERENCES users(userid),

);

CREATE TABLE IF NOT EXISTS answers (
   id INT(40) AUTO_INCREMENT,
   answer_id VARCHAR(255) NOT NULL UNIQUE,
   question_id VARCHAR(255) NOT NULL,
   user_id INT(20) NOT NULL,
   fullname VARCHAR(255) NOT NULL,
   answer TEXT NOT NULL,
   image VARCHAR(255),         -- Optional image URL/path
   voice VARCHAR(255), 

   FOREIGN KEY (question_id) REFERENCES questions(question_id),
   FOREIGN KEY (user_id) REFERENCES users(user_id),


   PRIMARY KEY (id, answer_id),
);


CREATE TABLE requests(
    id INT(40) AUTO_INCREMENT,
    requestId VARCHAR(255) NOT NULL UNIQUE,
    studentId INT NOT NULL,
    instructorId INT NOT NULL,
    request TEXT,
    description TEXT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (studentId) REFERENCES users(userid),
    FOREIGN KEY (instructorId) REFERENCES users(userid),

     PRIMARY KEY (id, requestId),

);
CREATE TABLE schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scheduleId VARCHAR(255) UNIQUE,
    requestId VARCHAR(255),
    instructorId INT NOT NULL,
    studentId INT NOT NULL,
    meetingLink TEXT NOT NULL,
    scheduledDate DATETIME NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (instructorId) REFERENCES users(userid),
    FOREIGN KEY (studentId) REFERENCES users(userid),
    FOREIGN KEY (requestId) REFERENCES requests(requestId)
);

CREATE TABLE notifications (
  notificationId VARCHAR(255) PRIMARY KEY,
  userId VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- optional: to direct to meetings page
  seen BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
);

CREATE TABLE resources (
  resourceId VARCHAR(50) PRIMARY KEY,
  instructorId VARCHAR(50),
  instructorName VARCHAR(100),
  title VARCHAR(255),
  description TEXT,
  category VARCHAR(100),
  fileUrl TEXT,
  imageUrl TEXT,
  videoUrl TEXT,
  voiceUrl TEXT,
  likes INT DEFAULT 0,
  dislikes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE resource_votes (
  voteId VARCHAR(100) PRIMARY KEY,
  userId VARCHAR(100),
  resourceId VARCHAR(100),
  action ENUM('like', 'dislike'),
  UNIQUE (userId, resourceId)
);


CREATE TABLE groups (
  groupId INT AUTO_INCREMENT PRIMARY KEY,
  groupName VARCHAR(100) NOT NULL,
  groupImage TEXT DEFAULT '',
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  groupId INT,
  userId INT,
  joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    FOREIGN KEY (groupId) REFERENCES groups(groupId),
  FOREIGN KEY (userId) REFERENCES users(userid)
);

CREATE TABLE group_messages (
  messageId INT AUTO_INCREMENT PRIMARY KEY,
  groupId INT,
  senderId INT,
  text TEXT,
  image TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   FOREIGN KEY (groupId) REFERENCES groups(groupId),
  FOREIGN KEY (senderId) REFERENCES users(userid)
);
CREATE TABLE iratings (
  ratingId VARCHAR(36) PRIMARY KEY,
  scheduleId VARCHAR(36),
  studentId VARCHAR(36),
  instructorId VARCHAR(36),
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (scheduleId) REFERENCES schedules(scheduleId),
  FOREIGN KEY (studentId) REFERENCES users(userid),
  FOREIGN KEY (instructorId) REFERENCES users(userid)
);
CREATE TABLE certificates (
  certificateId VARCHAR(36) PRIMARY KEY,
  instructorId VARCHAR(36),
  awardedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instructorId) REFERENCES users(userid)
);
