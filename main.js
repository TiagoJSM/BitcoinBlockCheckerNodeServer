var blockChecker = require('./modules/blockChecker');
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());
app.use(cors());

app.post('/', function (req, res) {
    if(!req.body.id){
        res.status(400).send('Missing id param');
        return;
    }
    blockChecker.verify(
        req.body.id, 
        function(result){
            res.send(result);    
        },
        function(){
            res.status(200).send(false);
        });  
});

var server = app.listen(8080, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});