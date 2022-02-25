const mongoose = require('mongoose');
const validator = require('validator');
const DSchema = mongoose.Schema;

const deviceSchema = new DSchema({
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
    remoteid:
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

const Device = mongoose.model('device', deviceSchema);
module.exports = Device;