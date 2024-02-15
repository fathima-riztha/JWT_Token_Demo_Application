const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
app.use(express.json());

const secretKey = 'cY768ydfKli@345%';
const refreshSecretKey = 'bhyji452#2^&%$rstf';

const users = [
{    id: 1, 
     username: 'john',
     password: '1234',
     isAdmin: true
},
{    id: 2, 
    username: 'jane',
    password: '4567',
    isAdmin: false
},
];

let refreshTokens = [];

app.post("/api/refreshtoken", (req, res) => {
  //take the refresh token from the user
  const refreshToken = req.body.token;
  //send error if there is no token or it is invalid
  if (!refreshToken) return res.sendStatus(401).json("You are not authenticated!");
  if (!refreshTokens.includes(refreshToken)) { return res.sendStatus(403).json("Refresh token is not valid!");
}
  jwt.verify(refreshToken, refreshSecretKey, (err, user) => {
    err && console.log(err);
    refreshTokens = refreshTokens.filter(token => token !== refreshToken);

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    refreshTokens.push(newRefreshToken);

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });

});

});

const generateAccessToken = (user) => {
  return jwt.sign({id: user.id, isAdmin: user.isAdmin}, secretKey, {expiresIn: '10s'});
}

const generateRefreshToken = (user) => {
  return jwt.sign({id: user.id, isAdmin: user.isAdmin}, refreshSecretKey, {expiresIn: '30m'});
}

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
    // Generate an access token
  const accessToken =  generateAccessToken(user);
  const refreshtoken =  generateRefreshToken(user);
  refreshTokens.push(refreshtoken);
    res.json({
    username: user.username,
    isAdmin: user.isAdmin,
    accessToken,
    refreshtoken
    });
    } else {
    res.status(400).json({ message: 'Invalid username or password' });
    }
});

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, secretKey, (err, user) => {
    if (err) {
    return res.sendStatus(403).json("Token is not valid!");
    }
    req.user = user;
    next();
    });
    } else {
    res.sendStatus(401).json("You are not authenticated!");
    }
};
  

app.delete("/api/users/:userId", verifyToken, (req, res) => {
  if (req.user.id === req.params.userId || req.user.isAdmin) {
          res.status(200).json("User has been deleted.");
  } else {
          res.status(403).json("You are not allowed to delete this user!");
        }
});

app.post("/api/logout", (req, res) => {
 const refreshToken = req.body.token;
  refreshTokens = refreshTokens.filter(token => token !== refreshToken);
  res.status(200).json("You logged out successfully.");
});



app.listen(5000, () => {
    console.log('Server is running on port 5000');
    });