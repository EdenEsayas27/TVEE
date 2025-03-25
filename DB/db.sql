CREATE TABLE users(
    userid INT(20) NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL,
    field VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL ,
    qualificationfile VARCHAR(100) ,
    PRIMARY KEY(userid)
);
CREATE TABLE questions(
    id INT(20) NOT NULL AUTO_INCREMENT,
    questionid VARCHAR(100) NOT NULL UNIQUE,
    userid INT(20) NOT NULL ,
    title VARCHAR(50) NOT NULL,
    describtion VARCHAR(400) NOT NULL,
    tag VARCHAR(20),
    PRIMARY KEY (id , questionid),
    FOREIGN key (userid) REFERENCES users(userid)   
);

Create TABLE answers(
    answerid INT(20) NOT NULL AUTO_INCREMENT,
    userid INT(20) NOT NULL,
    questionid VARCHAR(100) NOT NULL ,
    answer VARCHAR(400) NOT NULL ,
    PRIMARY KEY (answerid),
    FOREIGN KEY (userid) REFERENCES users(userid),
    FOREIGN KEY (questionid) REFERENCES questions(questionid)
);

