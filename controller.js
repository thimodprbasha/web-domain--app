const Pool = require('pg').Pool
const { Client } = require('pg/lib')
const env = require('./env')
const config = new Pool({
    user: env.DB.USER,
    host: env.DB.HOST,
    database: env.DB.DATABASE,
    password:  env.DB.PASSWORD,
    port: env.DB.PORT,
})

module.exports.initializeDB = function(){
    return new Promise((resolve , reject) =>{
        config.connect((error , client , done ) => {
            if (error) reject(error)
            resolve()
        })
    })
}

module.exports.queryDB =  function(args , query) {
    return new Promise((resolve , reject) =>{
        config.query(query , args,
            (error, results) => {
              if (error) {
                reject(error)
              }
              resolve(results)
            }
          );

    })
}

