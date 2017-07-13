let co = require('co');
let dbhelper = require('./dbhelper');
let people = require('./model/people');

co(function*() {

    let conn = yield dbhelper.getConnSync();

    let model = new people();
    model.Id = 1;
    model.Name = "jake";
    model.Score = 100;

    //insert
    let id = yield conn.insert(model);

    //update
    let result = yield conn.update(model);

    //delete
    let count = yield conn.deleteById(model, 1);

    //getById
    let p = yield conn.getById(model,1);

    console.log(result);

    conn.release();//释放数据库连接

});