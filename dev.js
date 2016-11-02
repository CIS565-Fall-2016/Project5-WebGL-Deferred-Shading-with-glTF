var express =  require('express')
var app = express()
var http = require('http')

app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname));

var livereload = require('livereload');
var server = livereload.createServer({
    exts: ['js', 'png', 'glsl']
});
server.watch(__dirname);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});