let service = require("./test.service");
let getalltest = async (req, res) => {
    return await service.getalltest();
}
module.exports = {
    getalltest
}