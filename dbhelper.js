let util = require("util");
let mysql = require("mysql");
let Connection = require("mysql/lib/Connection");

//when return undefined,It means the query is error.

Connection.prototype.exe = function (sql, param, cb) {
    this.query(sql, param, function (e, rows, fields) {

        if (e) {
            console.error(e);
            console.error(sql);
            console.error(param);
            cb(undefined);
            return;
        }

        if (typeof cb !== 'undefined') {
            if (rows.insertId !== 0) {
                cb(rows.insertId)
            } else if (rows.affectedRows !== 0)
                cb(rows.affectedRows);
            else {
                cb(rows.changedRows);
            }
        }
    });
};

Connection.prototype.exeSync = function (sql, param) {
    let me = this;
    return function (cb) {
        me.query(sql, param, function (e, rows, fields) {
            if (e) {
                console.error(e);
                console.error(sql);
                console.error(param);
                cb(null, undefined);
                return;
            }

            if (rows.insertId !== 0) {
                cb(null, rows.insertId)
            } else if (rows.affectedRows !== 0)
                cb(null, rows.affectedRows);
            else {
                cb(null, rows.changedRows);
            }

        });
    }
};

Connection.prototype.q = function (sql, param, cb) {

    this.query(sql, param, function (e, rows, fields) {
        if (e) {
            console.error(e);
            console.error(sql);
            console.error(param);
            cb(undefined);
            return;
        }

        if (typeof cb !== 'undefined') {
            cb(rows)
        }
    })
};

Connection.prototype.qSync = function (sql, param) {
    let me = this;
    return function (cb) {
        me.query(sql, param, function (e, rows, fields) {
            if (e) {
                console.error(e);
                console.error(sql);
                console.error(param);
                cb(null, undefined);
                return;
            }
            cb(null, rows);
        })
    }
};

Connection.prototype.qFirst = function (sql, param, cb) {

    this.query(sql, param, function (e, rows, fields) {
        if (e) {
            console.error(e);
            console.error(sql);
            console.error(param);
            cb(undefined);
            return;
        }

        if (typeof cb !== 'undefined') {
            if (rows.length > 0)
                cb(rows[0]);
            else
                cb(null);
        }
    })

};

Connection.prototype.qFirstSync = function (sql, param) { //同步方法
    let me = this;
    return function (cb) {
        me.query(sql, param, function (e, rows, fields) {
            if (e) {
                console.error(e);
                console.error(sql);
                console.error(param);
                cb(null, undefined);
                return;
            }
            if (rows.length > 0)
                cb(null, rows[0]);
            else
                cb(null, null);
        })
    }
};

Connection.prototype.beginTran = function () {
    let me = this;
    return function (cb) {
        me.beginTransaction(function (e) {
            if (e) {
                console.error(e);
                cb(null, undefined);
            } else
                cb(null, true);
        })
    }
};

Connection.prototype.commitTran = function () {
    let me = this;
    return function (cb) {
        me.commit(function (e) {
            if (e) {
                console.error(e);
                cb(null, undefined);
            } else
                cb(null, true);
        })
    }
};

Connection.prototype.rollbackTran = function () {
    let me = this;
    return function (cb) {
        me.rollback(function (e) {
            if (e) {
                console.error(e);
                cb(null, undefined);
            } else
                cb(null, true);
        })
    }
};

function forInsert(model) {

    let param = [];
    let fields = [];
    let par = [];

    for (let field in model) {

        if (model.hasOwnProperty(field)) {
            if (model.IsIdentity) {
                if (field === model.KeyName) {
                    continue;
                }
            }
            param.push(model[field]);
            fields.push("`" + field + "`");
            par.push("?");
        }
    }
    return { fields: fields.join(), par: par.join(","), param: param };
}

function forInsertIdentity(model) {

    let param = [];
    let fields = [];
    let par = [];

    for (let field in model) {

        if (model.hasOwnProperty(field)) {
            param.push(model[field]);
            fields.push("`" + field + "`");
            par.push("?");
        }
    }
    return { fields: fields.join(), par: par.join(","), param: param };
}

function forUpdate(model, updateFields) {
    let setFields = [];
    let param = [];
    if (updateFields !== undefined) {
        let arr = updateFields.split(",");
        for (let i in arr) {
            setFields.push("`" + arr[i] + "`=?");
            param.push(model[arr[i]]);
        }
    } else {
        for (let field in model) {
            if (model.hasOwnProperty(field)) {
                if (field === model.KeyName) {
                    continue;
                }

                setFields.push("`" + field + "`=?");
                param.push(model[field]);
            }
        }
    }
    param.push(model[model.KeyName]);
    return { param: param, setFields: setFields.join(",") }
}

Connection.prototype.insert = function (model) {
    let data = forInsert(model);
    let sql = util.format("INSERT INTO `%s` (%s)VALUES(%s)", model.TableName, data.fields, data.par);
    return this.exeSync(sql, data.param);

};

Connection.prototype.insertIdentity = function (model) {
    let data = forInsertIdentity(model);
    let sql = util.format("INSERT INTO `%s` (%s)VALUES(%s)", model.TableName, data.fields, data.par);
    return this.exeSync(sql, data.param);

};

Connection.prototype.update = function (model, updateFields) {
    let data = forUpdate(model, updateFields);
    let sql = util.format("UPDATE `%s` SET %s WHERE `%s`=?", model.TableName, data.setFields, model.KeyName);
    return this.exeSync(sql, data.param);
};

Connection.prototype.deleteById = function (model, id) {
    let sql = util.format("DELETE FROM `%s` WHERE `%s`=?", model.TableName, model.KeyName);
    return this.exeSync(sql, [id]);
};

Connection.prototype.deleteByIds = function (model, ids) {
    let par = '';
    for (let i in ids) {
        par += '?';
        if (i < ids.length - 1)
            par += ',';
    }

    let sql = util.format("DELETE FROM `%s` WHERE `%s` IN(%s)", model.TableName, model.KeyName, par);
    return this.exeSync(sql, ids);

};

Connection.prototype.deleteByWhere = function (model, where, param) {
    let sql = util.format("DELETE FROM `%s` %s", model.TableName, where);
    return this.exeSync(sql, param);
};

Connection.prototype.deleteAll = function (model) {
    let sql = util.format("DELETE FROM `%s`", model.TableName);
    return this.exeSync(sql);
};

Connection.prototype.getById = function (model, id, returnFields) {
    if (returnFields === undefined)
        returnFields = "*";
    let sql = util.format("SELECT %s FROM `%s` WHERE `%s`=?", returnFields, model.TableName, model.KeyName);
    return this.qFirstSync(sql, [id]);
};

Connection.prototype.getByIds = function (model, ids, returnFields) {
    let par = '';
    for (let i in ids) {
        par += '?';
        if (i < ids.length - 1)
            par += ',';
    }

    if (returnFields === undefined)
        returnFields = "*";

    let sql = util.format("SELECT %s FROM `%s` WHERE `%s` IN(%s)", returnFields, model.TableName, model.KeyName, par);
    return this.qSync(sql, ids);
};

Connection.prototype.getByIdsWhichField = function (model, ids, whichField, returnFields) {
    let par = '';
    for (let i in ids) {
        par += '?';
        if (i < ids.length - 1)
            par += ',';
    }

    if (returnFields === undefined)
        returnFields = "*";

    let sql = util.format("SELECT %s FROM `%s` WHERE `%s` IN(%s)", returnFields, model.TableName, whichField, par);
    return this.qSync(sql, ids);
};

Connection.prototype.getByWhere = function (model, where, param, returnFields) {
    if (returnFields === undefined)
        returnFields = "*";

    let sql = util.format("SELECT %s FROM  `%s` %s", returnFields, model.TableName, where);
    return this.qSync(sql, param);
};

Connection.prototype.getByWhereFirst = function (model, where, param, returnFields) {
    if (returnFields === undefined)
        returnFields = "*";
    let sql = util.format("SELECT %s FROM  `%s` %s", returnFields, model.TableName, where);
    return this.qFirstSync(sql, param);
};

Connection.prototype.getAll = function (model, returnFields, orderBy) {
    if (returnFields === undefined)
        returnFields = "*";
    if (orderBy === undefined || orderBy === null)
        orderBy = "";

    let sql = util.format("SELECT %s FROM `%s` %s", returnFields, model.TableName, orderBy);
    return this.qSync(sql);
};

Connection.prototype.getTotal = function (model, where, param) {
    let me = this;
    if (where === undefined || where === null)
        where = "";
    let sql = util.format("SELECT COUNT(1) as A FROM `%s`  %s", model.TableName, where);
    return function (cb) {
        me.qFirst(sql, param, function (row) {
            if (row === undefined)
                cb(null, undefined);
            else
                cb(null, row.A);
        });
    }
};

Connection.prototype.getBySkipTake = function (model, skip, take, where, param, returnFields) {
    if (returnFields === undefined)
        returnFields = "*";
    if (where === undefined || where === null)
        where = "";
    let sql = util.format("SELECT %s FROM `%s` %s LIMIT %d,%d", returnFields, model.TableName, where, skip, take);
    return this.qSync(sql, param);
};

Connection.prototype.getByPageIndex = function (model, pageIndex, pageSize, where, param, returnFields) {
    if (pageIndex === 0)
        pageIndex = 1;

    let skip = (pageIndex - 1) * pageSize;
    return this.getBySkipTake(model, skip, pageSize, where, param, returnFields);
};

Connection.prototype.getByPage = function (model, pageIndex, pageSize, where, param, returnFields) {
    let me = this;
    return function (cb) {
        me.getTotal(model, where, param)(function (aNull, total) {
            if (total === undefined)
                cb(null, undefined);
            else {
                me.getByPageIndex(model, pageIndex, pageSize, where, param, returnFields)(function (bNull, rows) {
                    if (rows === undefined)
                        cb(null, undefined);
                    else
                        return cb(null, { total: total, rows: rows });
                })
            }
        });
    };
};

//数据库连接池
let pool = mysql.createPool({
    //connectionLimit:10,
    host: '127.0.0.1',
    port: '3306',
    user: 'root',
    password: '123456',
    database: 'test'
});

//获取数据库连接
function getConn(callback) {
    pool.getConnection(function (err, conn) {
        if (err) {
            console.error(err);
            callback(undefined);
            return;
        }
        callback(conn);
    })
}

//获取数据库连接同步方法
function getConnSync() {

    return function (cb) {
        pool.getConnection(function (err, conn) {
            if (err) {
                console.error(err);
                cb(null, undefined);
                return;
            }
            cb(null, conn);
        })
    }

}

exports.mysql = mysql;
exports.getConn = getConn;
exports.getConnSync = getConnSync;
