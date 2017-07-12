# dbhelper
dbhelper
<h1>node.js orm for mysql</h1>

<h2>people.js</h2>

```javascript
function people() {
    this.Id = 0;
    this.Name = "";
    this.Score = 0;
    this.Time = new Date();
}

people.prototype.TableName = "people";
people.prototype.KeyName = "Id";
people.prototype.IsIdentity = true;

module.exports = people;
```
<h2>app.js</h2>

```javascript
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
    let p = yield  conn.getById(model);

    console.log(result);

    conn.release();//释放数据库连接

});

```
