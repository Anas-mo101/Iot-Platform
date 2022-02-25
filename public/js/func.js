var remoteBtn = document.querySelectorAll('.remote-buttons a');
var devstatus = document.getElementById('status');
var menu = document.getElementById('menu')
const http = new XMLHttpRequest();
var sessionClients;

const loadRemote = () => {
    http.open("GET", "http://localhost:3000/api/remote", false); 
    http.send();
    return http.responseText;
}

const loadDevs = () => {
    http.open("GET", "http://localhost:3000/api/devices", false);
    http.send();
    const devices = JSON.parse(http.responseText);
    for (let device of devices) {
        if(device.state){
            const x = `<option > ${device.name} </option> `;
            document.getElementById('menu').innerHTML = document.getElementById('menu').innerHTML + x;
        }
    }
    sessionClients = devices;
}

var ClinetID = loadRemote();
loadDevs();

const socket = new WebSocket("ws://localhost:3000/" + ClinetID);

function DataPackage(msg,desID) {
    var msg = {
        client: "remote",
        type: msg,
        id:   ClinetID,
        destinationID: desID
    };
    return JSON.stringify(msg); 
}

for (var i = 0; i < remoteBtn.length; i++) {
    remoteBtn[i].addEventListener('click', function(e) {
        if(menu.value != "Select Device"){
            let dev = sessionClients.find(dev => dev.name === menu.value);
            socket.send(DataPackage(e.target.innerHTML,dev.id));
            menu.style.background = "#3498db";
        }else{
            menu.style.background = "#ff2491"; // vibrate
        }
    });
}

socket.addEventListener('open', function open() {
    // socket.send(DataPackage('ON'));
    devstatus.innerHTML = "Status: ON";
});

socket.addEventListener('Close', function open() {
    // socket.send(DataPackage('OFF'));
    devstatus.innerHTML = "Status: OFF";
});

socket.addEventListener('message', function message(data) {
    console.log('received: %s', data);
});
