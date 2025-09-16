let express = require('express');

let app = express();

app.use(express.json());

app.use("/",require("./api.route"));

app.listen(9000,()=>{
    console.log("server is active at 9000")
})
