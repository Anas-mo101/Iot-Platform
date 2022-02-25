const http = new XMLHttpRequest();
http.open("GET", "http://localhost:3000/api/remote", false);
http.send();
const CID =  http.responseText;
const socket = new WebSocket("ws://localhost:3000/" + CID);

http.open("GET", "http://localhost:3000/api/devices", false);
http.send();
const devices = JSON.parse(http.responseText);
for (let device of devices) { 
    var state;
    device.state  ?  state = 'Online' : state = 'Offline';
    const x = `
        <li class="item type1">
            <div class="task">
                <div class="icon"> </div>
                <div class="name"> Device: ${device.name}</div>
            </div>
            <div class="status">
                <div class="icon" id="col${device.id}"> </div>
                <div class="text" id="${device.id}"> ` + state + `  </div>
            </div>
            <div class="dates">
                <div class="bar"> ID: ${device.id}</div>
            </div>
            <div class="devOptions" id="devedit${device.id}"> Edit </div>
            <div class="devOptions" id="devmoreinfo${device.id}"> More Info </div>
        </li>
        <div class="popdown" id="showinfo${device.id}" style="display: none;"> 
            <h2> Device info </h2>
            <div class="popdowninfo" > 
                <p class="popinfo" id="infostate${device.id}"> State: ` + state + `  </p>
                <p class="popinfo"> Temperature: </p>
                <p class="popinfo"> Uptime: </p>
                <p class="popinfo"> Log: </p>
                <p class="popinfo"> ID: ${device.id} </p>
                <p class="popinfo"> Last Command Timestamp: </p>
            </div>
        </div>
        <div class="popdown" id="showedit${device.id}" style="display: none;"> 
            <h2> Edit Device </h2>
            <h3> <h3>
            <div class="popdowninfo">
                <p class="popinfo"> Change Name: </p>
                <form class="box" action="/edit-dev/${device.id}" method="POST" >
                    <input type="text" name="newname" placeholder="new name" required>
                    <input type="submit" name="" value="save">
                </form>
            </div>
        </div>
    `;
    document.getElementById('menu').innerHTML = document.getElementById('menu').innerHTML + x;
    var statuscol = document.getElementById("col" + device.id);
    if(device.state){
        statuscol.style.background = "green";
    }else{
        statuscol.style.background = "red";
    }
}


socket.addEventListener('message', function message(event){
    var incoming = JSON.parse(event.data);
    if(incoming.type === "Online"){
        var devstate = document.getElementById(incoming.id);
        var statuscol = document.getElementById("col" + incoming.id);
        var infostate = document.getElementById("infostate" + incoming.id);
        infostate.innerHTML = "State: Online";
        devstate.innerHTML = "Online";
        statuscol.style.background = "green";
    }else if (incoming.type === "Offline"){
        var devstate = document.getElementById(incoming.id);
        var statuscol = document.getElementById("col" + incoming.id);
        var infostate = document.getElementById("infostate" + incoming.id);
        infostate.innerHTML = "State: Offline";
        devstate.innerHTML = "Offline";
        statuscol.style.background = "red";
    }
});


var options = document.getElementsByClassName("devOptions")
for(let option of options){
    option.addEventListener('click', (e) => {
        var tar = e.target.innerHTML;
        if(tar.trim() == "More Info"){
            var temp = document.getElementById("showinfo" + option.getAttribute("id").slice(11) );
            if(temp.style.display != "block"){
                temp.style.display = "block";
            }else{
                temp.style.display = "none";
            }
        }else if(tar.trim() == "Edit"){
            var temp = document.getElementById("showedit" + option.getAttribute("id").slice(7) );
            if(temp.style.display != "block"){
                temp.style.display = "block";
            }else{
                temp.style.display = "none";
            }
        }
    });
}

// function decodeHtml(html) {
//     var txt = document.createElement("temprun");
//     txt.innerHTML = html;
//     return txt.innerHTML;
// }

socket.addEventListener('open', function open() { 
    
});

socket.addEventListener('close', function open() { 

});