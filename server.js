//Declare variables
var express = require('express');
var os = require('os');
var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var totalmem = ~~(os.totalmem() / 1024 /1024);


//Start server
server.listen(80);
console.log("Server started at http://127.0.0.1:80");


//Direct to dashboard
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/public/dash.html');
});

//Create array of clients
var clients = [];

//Create loop to update page
var startMeasure = cpuAverage(); //Won't this make it the CPU average since the script started?
setInterval(function(){
   for(i=0;i < clients.length;i++) {
     var usedRAM = getMemory();
     var socket = clients[i];

     var endMeasure = cpuAverage(); 
     var idleDifference = endMeasure.idle - startMeasure.idle;
     var totalDifference = endMeasure.total - startMeasure.total;
     var percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
     
     uptime = findUptime();

     socket.emit('uptime', {"days":uptime.days,"hours":uptime.hours,"minutes":uptime.minutes,"seconds":uptime.seconds});
     socket.emit('memory', {"current":usedRAM,"maximum":totalmem});
     socket.emit('cpu', {"current":percentageCPU,"maximum":100});
   }
   startMeasure = cpuAverage();
}, 1000);

//create socket when user connects
io.sockets.on('connection', function (socket) {
  clients.push(socket);

  //Handle client disconnects
  socket.on('disconnect', function() {
    clients.splice(clients.indexOf(socket), 1);
    console.log("Client disconnected");
  });
});

//Get memory stats
function getMemory() {
  var usedRAM = os.totalmem() - os.freemem();
  usedRAM = ~~(usedRAM /1024 /1024);
  return(usedRAM);
}

  setTimeout(function() { 
    var endMeasure = cpuAverage(); 
    var idleDifference = endMeasure.idle - startMeasure.idle;
    var totalDifference = endMeasure.total - startMeasure.total;
    var percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
  }, 100);

//Function to get current CPU status
function cpuAverage() {
  var totalIdle = 0, totalTick = 0;
  var cpus = os.cpus();
   for(var i = 0, len = cpus.length; i < len; i++) {
     var cpu = cpus[i];
     for(type in cpu.times) {
       totalTick += cpu.times[type];
     }     
     totalIdle += cpu.times.idle;
   }
  return {idle: totalIdle / cpus.length,  total: totalTick / cpus.length};
}

function findUptime(){
  var uptime = os.uptime(); 
  var days = uptime / 60 / 60 / 24; 
  var hours =  uptime / 60 / 60 - (~~days * 24); 
  var minutes = uptime / 60 - ((~~hours * 60) + (~~days * 24 * 60)); 
  var seconds = uptime - ((~~minutes * 60) + (~~hours * 60 * 60) + (~~days * 24 * 60 * 60)); 
  return { days: ~~days, hours: ~~hours, minutes: ~~minutes, seconds: ~~seconds }
}
