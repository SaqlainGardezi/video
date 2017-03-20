//require websocket library
var WebSocketServer=require('ws').Server;

//creating websocket server at port 9090
var wss=new WebSocketServer({port: 9090});

//all connected to the server users
var users={};


//when a user connects to our server
wss.on('connection', function(connection){

	console.log('user connected');

	//when server gets messsage from connected user
	connection.on('message',function(message){

		var data;

		//accepting only json messages
		try{
			data=JSON.parse(message);
		}
		catch(e){
			console.log('Invalid JSON');
			data={};
		}

		//switching type of user message
		switch(data.type){
			// when a user tries to login
			case "login":
				console.log('User logged : ', data.name);

				//if anyuser already logged in with this username then refuse
				if (users[data.name]) {
					sendTo(connection, {
						type:"login",
						success: failure
					});
				}else{
					// save user connection to server
					users[data.name]=connection;
					connection.name=data.name;

					sendTo(connection,{
						type:'login',
						success:true
					});
				}
				break;

			case "offer":
				//e.g UserA want to call UserB
				console.log("Sending offer to :  " + data.name);

				//if USerB exists then send him offer detail
				var conn=users[data.name];

				if (conn !== null) {
					// setting  that UserA connected to UserB
					connection.otherName=data.name;

					sendTo(conn, {
						type: "offer",
						offer: data.offer,
						name: connection.name
					});
				}
				break;

			case "answer":
				console.log("sending answer to : ", data.name);
				//e.g userB  answer to userA
				var conn=users[data.name];

				if (conn !== null) {
					connection.otherName=data.name;
					sendTo(conn, {
						type:"answer",
						answer:data.answer
					});
				}
				break;

			case "candidate":
				console.log("Sending candidate to : ", data.name);
				var conn=users[data.name];

				if (conn !== null) {
					console.log("candiate sent");
					sendTo(conn, {
						type:"candidate",
						candidate: data.candidate
					});	
				}
			break;

			case "leave":
				console.log("Disconnecting from ", data.name);
				var conn=users[data.name];
				conn.otherName=null;

				//notify the other User so he can disconnect his per connection
				if (conn !== null) {
					sendTo(conn, {
						type: "leave"
					});
				}
			break;

			default:
				sendTo(connection, {
					type:"error",
					message: "Command not found : " + data.type
				});
				break;
		}

	});


	//When user closes browser
	connection.on('close', function(){

		if (connection.name) {
			delete users[connection.name];

			if (connection.otherName) {
				console.log("Disconnecting from : ", connection.otherName);
				var conn=users[connection.otherName];
				conn.otherName=null;

				if (conn!==null) {
					sendTo(conn, {
						type: leave
					});
				}
			}
		}
	});

	connection.send('Hello from the server');
});

//helper function to send messages to connection
function sendTo(connection,  message){
	connection.send(JSON.stringify(message));
}