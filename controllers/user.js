const User = require("../models/User.js");
const bcrypt = require("bcrypt"); //bcryptjs
const { createAccessToken, errorHandler } = require("../auth.js")

module.exports.registerUser = (req, res) => {
	let newUser = new User({
		email: req.body.email.trim(),
		username: req.body.username.trim(),
		password: bcrypt.hashSync(req.body.password, 10)
	})

	if (!email || !username || !password) {
        return res.status(400).send({ error: "All fields are required" });
    }

	if(!newUser.email.includes("@")) {
		return res.status(400).send({error: "Email invalid"})
	}
	if(req.body.password.length < 8) {
		return res.status(400).send({error: "Password must be atleast 8 characters"})
	}

	return newUser.save()
	.then(result => res.status(201).send({message: "Registered Successfully"}))
	.catch(err => errorHandler(err, req, res))
};

module.exports.loginUser = (req, res) => {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
        return res.status(400).send({ error: "Both email/username and password are required" });
    }

    return User.findOne({
        $or: [
            { email: emailOrUsername.trim() }, 
            { username: emailOrUsername.trim() }
        ]
    })
    .then(result => {
        if (!result) {
            return res.status(404).send({ error: 'No user found' });
        }

        const isPasswordCorrect = bcrypt.compareSync(password, result.password);

        if (isPasswordCorrect) {
            return res.status(200).send({ access: createAccessToken(result) });
        } else {
            return res.status(401).send({ error: 'Credentials do not match' });
        }
    })
    .catch(err => errorHandler(err, req, res));
};

module.exports.getProfile = (req, res) => {
    // Safeguard in case req.user is not properly set by the verify middleware
    if (!req.user || !req.user.id) {
        return res.status(401).send({ error: "Unauthorized - Invalid token" });
    }

    return User.findById(req.user.id)
    .then(user => {
        if(!user){
            // If the user ID is invalid or doesn't exist
            return res.status(404).send({ error: 'User not found' })
        }else {
            // if the user is found, return the user.
            // user.password = "";
            // return res.status(200).send(user);
            
            // Use .toObject() to safely manipulate data
            const userData = user.toObject();
            delete userData.password; // Remove password field

            // Return the user data without the password
            return res.status(200).send(userData);
        }  
    })
    .catch(error => errorHandler(error, req, res));
};