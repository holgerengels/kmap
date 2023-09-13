var fs = require("fs");
var name = process.argv[2];
console.log("\n *START transformation of " + name + " * \n");
var content = fs.readFileSync(name);
var json = JSON.parse(content);
var docs = json.rows;
var newDocs = new Array();
docs.forEach(function(doc) {
    var innerdoc = doc.doc;
    delete innerdoc._rev;
    newDocs.push(innerdoc);
});
var newJson = new Object();
newJson.docs = newDocs;
var newContent = JSON.stringify(newJson)
fs.writeFile(name, newContent, 'utf8', function(err) {
    if (err) throw err;
    console.log('complete');
});
console.log("\n *DONE transformation!* \n");
