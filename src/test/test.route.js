let route = require("express").Router();
let contoller = require("./test.controller");

route.get("/getalltest", async(req,res)=>{
    let model = await contoller.getalltest();
    res.status(model.status).send(model.data);
})
module.exports = route;