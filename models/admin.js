const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const ASchema = mongoose.Schema;

const adminSchema = new ASchema({
    id: 
    {
        type: String,
        required: true,
        unique: true
    },
    name: 
    {
        type: String,
        required: true,
    },
    usertype: 
    {
        type: String,
        required: true,
    },
    email:
    {
        type: String,
        required: true,
        unique: true,
        validate: (value) => {
        return validator.isEmail(value)
        }
    },
    password:
    {
        type: String,
        required: true,
    },
    state:
    {
        type: Boolean,
        required: true
    }
 }, {timestamps: true});



adminSchema.pre('save', async function(next){      // encrypting user data before its saved
    try {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(this.password, salt);
        this.password = hashed;
        next();
    } catch (error) {
        next(error);
    }
});

const Admin = mongoose.model('admin', adminSchema);
module.exports = Admin;