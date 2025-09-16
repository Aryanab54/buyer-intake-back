const getalltest = async () => {
    return {
        status: 200,
        data: {
            message: "Hello from service"
        }
    }
}

module.exports = {
    getalltest
}