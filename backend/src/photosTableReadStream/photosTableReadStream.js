const axios = require('axios').default;

exports.handler = async (event) => {

    // this just kicks off a deploy hook to vercel
    const url = process.env.hookURL;

    const bk = await axios.get(url);
    return bk

};