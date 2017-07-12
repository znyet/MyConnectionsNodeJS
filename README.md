# dbhelper
dbhelper
<h1>node.js orm</h1>

<h2>people.js</h2>
<code>
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
</code>
