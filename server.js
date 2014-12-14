var pendingUsers = [];

var Cache = require("./js/Cache");

var usersCache = new Cache();
var partidosCache = new Cache();
var ligasCache = new Cache();

/////////////////////////////DATA BASE////////////////////////////////////////////
var Usergrid = require("usergrid");

var client = new Usergrid.client({
    orgName:'facka',
    appName:'futbol5',
    authType: Usergrid.AUTH_CLIENT_ID,
    clientId:'b3U6vqDXqih6EeOyMN0HGsQPKQ',
    clientSecret:'b3U64Lj1JMpU1-eAymvZoEXrZos8038',
    logging: false, //optional - turn on logging, off by default
    buildCurl: false //optional - turn on curl commands, off by default
});

var DB = {
	utils: {
		removePlusSymbol : function(str) {
			var plusCode = '{{plus}}';
			while (str.indexOf('+') != -1) {
				str = str.replace('+',plusCode);
			}
			return str;
		},
		addPlusSymbol : function (str) {
			var plusCode = '{{plus}}';
			while (str.indexOf(plusCode) != -1) {
				str = str.replace(plusCode, '+');
			}
			return str;	
		}
	},
	saveUser : function(user, success, error) {
		console.log("saving user "+ user.name + " in the database.");
		user['type'] = 'jugadores';
		user.email = DB.utils.removePlusSymbol(user.email);
		client.createEntity(user, function (err, data) {
	    if (err) {
	    	error("Usuario ya existente.");
	    } 
	    else {
	    	var newUser = data._data;
	    	newUser.email = DB.utils.addPlusSymbol(newUser.email);
	    	usersCache.update(newUser.code,newUser);
	    	success(newUser);
	    }
		});
	},
	savePartido : function(partido, success, error) {
		console.log("saving partido "+ partido.nombre + " in the database.");
		partido['type'] = 'partidos';
		client.createEntity(partido, function (err, data) {
	    if (err) {
	    	console.log("Partido no creado.");
	    	error("Partido no creado.");
	    } 
	    else {
	    	var newPartido = data._data;
	    	partidosCache.update(newPartido.code,newPartido);
	    	success(newPartido);
	    }
		});
	},
	saveLiga : function(liga, success, error) {
		console.log("saving liga "+ liga.name + " in the database.");
		liga['type'] = 'ligas';
		client.createEntity(liga, function (err, data) {
	    if (err) {
	    	error("Liga no creado.");
	    } 
	    else {
	    	var newLiga = data._data;
	    	ligasCache.update(newLiga.name, newLiga);
	    	success(newLiga);
	    }
		});
	},
	getUser : function(code, success, error) {
		var cache = usersCache.get(code);
		if (cache) {
			console.log("Returning jugador from cache...");
			success(cache)
		}
		else {
			console.log("Finding jugador in database...");
			var options = {
			  	method:'GET',
	    		endpoint:'jugadores',
	    		qs: {ql:"select * where code='"+code+"'"}
			}
			client.request(options, function(err, data) {
			    if (err){
			        console.log("Error buscando el jugador");
			        error("Error buscando el jugador.");
			    } else {
	 				var jugador = data.entities[0];
	 				if (jugador) {
	 					jugador.email = DB.utils.addPlusSymbol(jugador.email);
	 					usersCache.update(jugador.code,jugador);
	 				}
			        success(jugador);
			    }
			});
		}
	},
	getUserByEmail : function(email, success, error) {
		console.log("Finding jugador by email "+email+" in database...");
		email = DB.utils.removePlusSymbol(email);
		var options = {
		  	method:'GET',
    		endpoint:'jugadores',
    		qs: {ql:"select * where email='"+email+"'"}
		}

		client.request(options, function(err, data) {
		    if (err){
		        console.log("Error buscando el jugador");
		        error("Error buscando el jugador.");
		    } else {
		        var jugador = data.entities[0];
		        if (jugador){
		        	jugador.email = DB.utils.addPlusSymbol(jugador.email);
		        }
		        success(jugador);
		    }
		});
	},
	getPartido : function(code, success, error) {
		var cache = partidosCache.get(code);
		if (cache) {
			console.log("Returning partido from cache...");
			success(cache)
		}
		else {
			console.log("getting partido "+ code+" from database");
			var options = {
	    		method:'GET',
	    		endpoint:'partidos',
	    		qs: {ql:"select * where code='"+code+"'"}
			};
			client.request(options, function (err, data) {
			    if (err) {
			    	console.log("Error al buscar el partido");
			        error("Error buscando el partido.");
			    } else {
			    	var partido = data.entities[0];
			    	if (partido) {
			    		partidosCache.update(partido.code,partido);	
			    	}
			        success(partido);
			    }
			});
		}
	},
	getPartidos : function(success, error) {
		console.log("getting partidos from database");
		var options = {
    		method:'GET',
    		endpoint:'partidos'
		};
		client.request(options, function (err, data) {
		    if (err) {
		    	console.log("Error al obtener todos los partidos");
		        error("Error al obtener todos los partidos");
		    } else {
		    	var partidos = data.entities
		        success(partidos);
		    }
		});
	},
	getLiga : function(name, success, error) {
		var cache = ligasCache.get(name);
		if (cache) {
			console.log("Returning liga from cache...");
			success(cache)
		}
		else {
			console.log("getting liga "+ name+ " from Database");
			var options = {
	    		method:'GET',
	    		endpoint:'ligas',
	    		qs: {ql:"select * where name='"+name+"'"}
			};
			client.request(options, function (err, data) {
			    if (err) {
			    	console.log("Error al buscar la liga");
			        error("Error buscando la liga.");
			    } else {
			    	var liga = data.entities[0];
			    	if (liga) {
			    		ligasCache.update(liga.name, liga);
			    	}
			        success(liga);
			    }
			});
		}
	},
	updateUser : function(user,success,error) {
		console.log("Updating jugador in database...");
		
		var onUserExists = function(userFound) {
			var options = {
				type:'jugadores',
    			uuid: userFound.uuid,
    			getOnExist:true
			};
			client.createEntity(options, function (errorCreatingEntity, data) {
			    if (errorCreatingEntity) {
			        error("Error al actualizar el jugador.");
			    } else {
			    	user.email = DB.utils.removePlusSymbol(user.email);
			    	data.set(user);
			        data.save(function(err){
			        	if (err) {
			        		error("Error al actualizar jugador.");
			        	}
			        	else {
			        		user.email = DB.utils.addPlusSymbol(user.email);
			        		usersCache.update(user.code, user);
			        		success(user);
			        	}
			        });
				}
			});
		};
		var onUserNotFound = function() {
			erro("User not found!");
		};
		DB.getUser(user.code, onUserExists,onUserNotFound);
	},
	updatePartido : function(partido,success,error) {
		console.log("Updating partido in database...");
		var onPartidoExists = function(partidoFound) {
			var options = {
				type:'partidos',
    			uuid: partidoFound.uuid,
    			getOnExist:true
			};
			client.createEntity(options, function (errorCreatingEntity, data) {
			    if (errorCreatingEntity) {
			        error("Error al actualizar partido.");
			    } else {
			    	data.set(partidoService.toLightPartido(partido));
			        data.save(function(err){
			        	if (err) {
			        		error("Error al actualizar partido.");
			        	}
			        	else {
			        		partidosCache.update(partido.code, partido);
			        		console.log("Returning partido updated");
			        		success(partido);
			        	}
			        });
				}
			});
		};
		var onPartidoNotFound = function() {
			erro("Partido not found!");
		};
		DB.getPartido(partido.code, onPartidoExists,onPartidoNotFound);
	},
	updateLiga : function(liga,success,error) {
		console.log("Updating liga in database...");
		var onLigaExists = function(ligaFound) {
			var options = {
				type:'ligas',
    			uuid: ligaFound.uuid,
    			getOnExist:true
			};
			client.createEntity(options, function (errorCreatingEntity, data) {
			    if (errorCreatingEntity) {
			        error("Error al actualizar liga.");
			    } else {
			    	data.set(liga);
			        data.save(function(err){
			        	if (err) {
			        		error("Error al actualizar liga.");
			        	}
			        	else {
			        		ligasCache.update(liga.name, liga);
			        		success(liga);
			        	}
			        });
				}
			});
		};
		var onLigaNotFound = function() {
			erro("Liga not found!");
		};
		DB.getLiga(liga.name, onLigaExists,onLigaNotFound);
	},
	doQuery : function(collection, query,success,error) {
	var options = {
		  	method:'GET',
    		endpoint:collection,
    		qs: {ql:query}
		}

		client.request(options, function(err, data) {
		    if (err){
		        error("Error ejecutnado consulta "+ query);
		    } else {
		        success(data.entities);
		    }
		});
	}
};

///////////////////////////////DATA BASE END//////////////////////////////////////////

///////////////////////////////START SERVICES//////////////////////////////////////
var usuarioService = {
	construct : function(name, email, estrellas, ligas, code) {
		return {
			name: name,
			email: email,
			estrellas: estrellas,
			ligas: ligas,
			code: code
		}
	},
	exists : function(email, success, error) {
		var onSuccess = function(data) {
			if (data) {
				success(data);
			}
			else {
				var found = false;
				for (var item in pendingUsers) {
					var user = pendingUsers[item];
					if (user.email === email) {
						found = true;
						success(user);
					}
				}	
				if (!found) {
					success(null);
				}
			}
		};
		DB.getUserByEmail(email,onSuccess,error);
	},
	//Al momento de crear un usuario, cheqear que a la liga que pertenece si no tiene usuarios sea administrador
	save : function(usuario,success,error) {
		var onSuccessGettingLiga = function(liga) {

			if (liga.jugadores.length == 0) {
				liga.admins = [usuario.email];
			}
			liga.jugadores.push(usuario.email);
			var onSuccessUpdatingLiga = function () {
				DB.saveUser(usuario,success,error);
			};

			ligaService.updateLiga(liga, onSuccessUpdatingLiga,error);
		};
		var ligaInicial = usuario.ligas[0]; // El usuario al inicio tiene una sola liga.
		ligaService.get(ligaInicial, onSuccessGettingLiga, error);
		//TODO hacer esto en el momento en que se registra el usuario.
	},
	get : function(usuarioId, success, error) {
		console.log("usuarioService.get("+usuarioId+")");
		DB.getUser(usuarioId,success,error);
		//TODO mapear el usuario retornado a lightUsuario
	},
	activateUser : function(code,success, error) {
		var i = 0;
		var userFound = false;
		var userFoundAt;
		for (var item in pendingUsers) {
			var user = pendingUsers[item];
			if (user.code === code) {
				userFound = true;
				userFoundAt = i;
				var onSuccess = function(data) {
					pendingUsers.splice(userFoundAt,1);
					//Show pending matches
					success(data);
				};
				var onError = function(errorMessage) {
					error(errorMessage);
				};
				usuarioService.save(user,onSuccess,onError);
			}
			i++;
		}
		if (!userFound) {
			error("Codigo invalido, no se puede activar.");
		}
	},
	//Se notifica un nuevo partido a todos los usuarios de esa liga
	notificarNuevoPartido: function(partido, language) {
		var onSuccessGettingLiga = function (liga) {
			for (var index in liga.jugadores){
				var jugadorEmail = liga.jugadores[index];
			
				var onSuccessGettingJugador = function(jugador) {
					if (jugador) {
						sendEmail(getPartidoInvitationEmailOptions(jugador,partido,language));	
					}
					else {
						console.log("No se encontro el usuario en la liga para enviarle el mail.");
					}
				};
				var onErrorGettingJugador = function (error) {
					console.log(error);
				};

				DB.getUserByEmail(jugadorEmail, onSuccessGettingJugador, onErrorGettingJugador);
			}			
		};

		var onErrorGettingLiga = function (error) {
			//No se hace nada, ver la forma de notificar
			console.log(error);
		}

		ligaService.get(partido.liga, onSuccessGettingLiga, onErrorGettingLiga);

		//TODO get Liga del partido , iterar sobre los jugadores de la liga y enviar el mail
	},
	toLightUser: function(user) {
		return {
			name : user.name,
	  		email : user.email,
	  		estrellas : user.estrellas
		};
	}
};

var partidoService = {
	construct: function(name, cancha, fecha, hora, precio, liga, jugadores, suplentes, nojuegan, cantidadJugadores, code) {
		return {
			nombre : name,
		    cancha : cancha,
		    fecha : fecha,
		    hora : hora,
		    precio : precio,
		    liga : liga,
		    jugadores : jugadores,
		    suplentes : suplentes,
		    nojuegan : nojuegan,
		    cantidadJugadores: cantidadJugadores,
		    code : code
		}
	},
	exists : function(partidoId,success,error){
		var onSuccess = function(data) {
			if (data) {
				success(true);
			}
			else {
				success(false);
			}
		};
		DB.getPartido(partidoId,onSuccess,error);	
	},
	save : function(partido,success,error) {
		var onSuccessCreatingPartido = function(newPartido) {
			console.log("Success Creating Partido, now we check the league.");
			var onSuccessGettingLiga = function(liga) {
				console.log("La liga es " + liga.name);
				if (liga) {
					liga.partidos.push(partido.code);
					ligaService.updateLiga(liga, success, error);	
				}
				else {
					var liga = ligaService.construct(partido.liga, [partido.code], [], null, []);
					ligaService.saveLiga(liga,success,error);
				}
				
			};
			ligaService.get(partido.liga, onSuccessGettingLiga, error);
		};
		DB.savePartido(partido,onSuccessCreatingPartido,error);
	},
	get : function(partidoId,success, error) {
		DB.getPartido(partidoId,success,error);
	},
	getAll : function(success, error) {
		DB.getPartidos(success,error);
	},
	getJugador : function(partido, jugadorId,success,error) {
		var onSuccess = function(data) {
			var found;
			for (var i in partido.jugadores) {
				var jugador = partido.jugadores[i];
				if (jugador.code === jugadorId) {
					found = true;
					success(jugador);
				}
			}
			if (!found) {
				error("Jugador no encontrado");
			}
		};
		DB.doQuery("partidos","select * where code = '"+partido.code+"'",onSuccess,error);
	},
	addJugador : function(partido, jugador, as, success, error) {

		var quitarJugador = function(lista, email) {
			var i = 0;
			for (var item in lista) {
				var jugador = lista[item];
				if (jugador.email === email) {
					lista.splice(i,1);
				}
				i++;
			}
		};

		var existeEnLista = function(lista, email) {
			for (var item in lista) {
				var jugador = lista[item];
				if (jugador.email === email) {
					return true;
				}
			}
			return false;
		};

		if (as == "titular") {
			if (partido.cantidadJugadores == partido.jugadores.length) {
				console.log("No hay vacantes para este partido.");
				quitarJugador(partido.suplentes, jugador.email);
				quitarJugador(partido.nojuegan, jugador.email);
				if (!existeEnLista(partido.suplentes, jugador.email)){
					partido.suplentes.push(jugador);	
				}

				var onSuccessUpdatePartido = function(data) {
			        //TODO get jugadores de una liga y notificar a todos
			        var onSuccess = function(jugadoresActivos) {
			        	for (var i in jugadoresActivos) {
			        		var destinatarioEmail = jugadoresActivos[i];
			        		var onSuccessGetUserByEmail = function (destinatario)  {
			        			if (destinatario)
					     			sendEmail(getPartidoUpdateEmailOptions(jugador,"suplente",partido,destinatario));	
					     		else 
					     			console.log("Mail no enviado dado que no se encontro el jugador");
					     	};
					     	var onErrorGetUserByEmail = function() {
					     		console.log("Warning: player not added to the list of active players");
					     	};
					     	DB.getUserByEmail(destinatarioEmail, onSuccessGetUserByEmail, onErrorGetUserByEmail);
			        		
			        	}
			        };
			        var onError = function() {
			        	console.log("Error al obtener los jugadores activos de un partido!");
			        };
			        console.log("Se llama a get Jugadores Aactivos");
					partidoService.getJugadoresActivos(data, onSuccess, onError);
					//Retorna el control y luego se enviaran los emails
					success(data);	
				};

				DB.updatePartido(partido,onSuccessUpdatePartido,error);
			}
			else {
				if (!existeEnLista(partido.jugadores, jugador.email)){
					partido.jugadores.push(jugador);
				}
				quitarJugador(partido.suplentes, jugador.email);
				quitarJugador(partido.nojuegan, jugador.email);
				var onSuccessUpdatePartido = function(data) {			        
					var onSuccess = function(jugadoresActivos) {
						console.log("Jugadores activos = "+ jugadoresActivos.length);
			        	for (var i in jugadoresActivos) {
			        		var destinatarioEmail = jugadoresActivos[i];
			        		var onSuccessGetUserByEmail = function (destinatario)  {
			        			if (destinatario)
					     			sendEmail(getPartidoUpdateEmailOptions(jugador,"titular",partido,destinatario));	
					     		else 
					     			console.log("Mail no enviado dado que no se encontro el jugador");
					     		
					     	};
					     	var onErrorGetUserByEmail = function() {
					     		console.log("Warning: player not added to the list of active players");
					     	};
					     	DB.getUserByEmail(destinatarioEmail, onSuccessGetUserByEmail, onErrorGetUserByEmail);
			        	}
			        };
			        var onError = function() {
			        	console.log("Error al obtener los jugadores activos de un partido!");
			        };
			        console.log("Se llama a get Jugadores Activos");
					partidoService.getJugadoresActivos(data, onSuccess, onError);
					success(data);
				};
				DB.updatePartido(partido,onSuccessUpdatePartido,error);
			}
		}
		if (as == "suplente") {
			if (!existeEnLista(partido.suplentes, jugador.email)){
				partido.suplentes.push(jugador);
			}
			quitarJugador(partido.jugadores, jugador.email);
			quitarJugador(partido.nojuegan, jugador.email);
			var onSuccessUpdatePartido = function(data) {
					var onSuccess = function(jugadoresActivos) {
			        	for (var i in jugadoresActivos) {
			        		var destinatarioEmail = jugadoresActivos[i];
			        		var onSuccessGetUserByEmail = function (destinatario)  {
			        			if (destinatario)
					     			sendEmail(getPartidoUpdateEmailOptions(jugador,"suplente",partido,destinatario));	
					     		else 
					     			console.log("Mail no enviado dado que no se encontro el jugador");
					     	};
					     	var onErrorGetUserByEmail = function() {
					     		console.log("Warning: player not added to the list of active players");
					     	};
					     	DB.getUserByEmail(destinatarioEmail, onSuccessGetUserByEmail, onErrorGetUserByEmail);	
			        	}
			        };
			        var onError = function() {
			        	console.log("Error al obtener los jugadores activos de un partido!");
			        };
					partidoService.getJugadoresActivos(data, onSuccess, onError);
					success(data);
				};
			DB.updatePartido(partido,onSuccessUpdatePartido,error);	
		}
		if (as == "nojuega") {
			console.log("Set no juega");
			if (!existeEnLista(partido.nojuegan, jugador.email)){
				partido.nojuegan.push(jugador);
			}
			quitarJugador(partido.jugadores, jugador.email);
			quitarJugador(partido.suplentes, jugador.email);
			var onSuccessUpdatePartido = function(data) {
			  	var onSuccess = function(jugadoresActivos) {
		        	for (var i in jugadoresActivos) {
		        		var destinatarioEmail = jugadoresActivos[i];
		        		var onSuccessGetUserByEmail = function (destinatario)  {
			        			if (destinatario)
					     			sendEmail(getPartidoUpdateEmailOptions(jugador,"nojuega",partido,destinatario));	
					     		else 
					     			console.log("Mail no enviado dado que no se encontro el jugador");
					     	};
					     	var onErrorGetUserByEmail = function() {
					     		console.log("Warning: player not added to the list of active players");
					     	};
					     	DB.getUserByEmail(destinatarioEmail, onSuccessGetUserByEmail, onErrorGetUserByEmail);	
		        		
		        	}
		        };
		        var onError = function() {
		        	console.log("Error al obtener los jugadores activos de un partido!");
		        };
				partidoService.getJugadoresActivos(data, onSuccess, onError);
				success(data);
			};
			DB.updatePartido(partido,onSuccessUpdatePartido,error);		
		}
	},
	removeJugador: function(partido, jugadorId, success, error) {
		var i = 0;
		var foundAt;
		for (var item in partido.jugadores) {
			var jugador = partido.jugadores[item];
			if (jugador.code === jugadorId) {
				partido.jugadores.splice(i,1);
				foundAt = i;
				DB.updatePartido(partido,success,error);		
			}
			i++;
		}
		if (!foundAt) {
			error("Jugador no encontrado");
		}
	},
	getJugadoresActivos: function(partido, success, error){
		var onSuccessGettingLiga = function(liga) {
			var jugadoresActivos = [];

			var existeEnLista = function(lista, email) {
				for (var item in lista) {
					var jugador = lista[item];
					if (jugador.email === email) {
						return true;
					}
				}
				return false;
			};

			for(var index in liga.jugadores) {
			     var jugadorLiga = liga.jugadores[index];
			     if (!existeEnLista(partido.nojuegan, jugadorLiga)) {
			     	jugadoresActivos.push(jugadorLiga);	
			     	/*var onSuccess = function (jugador)  {
			     		console.log("Agregado "+jugador.name);
			     		jugadoresActivos.push(jugadorLiga);	
			     	};
			     	var onError = function() {
			     		console.log("Warning: player not added to the list of active players");
			     	};
			     	DB.getUserByEmail(jugadorLiga, success, error);
			    	*/
			     }
			}
			console.log("Se retorna la lista de jugadores activos");
			success(jugadoresActivos);
		};
		ligaService.get(partido.liga, onSuccessGettingLiga, error);
	},
	toLightPartido: function(partido){
		if (!partido) {
			return null;
		}
		var lightJugadores = [];
	  	for (var i in partido.jugadores) {
	  		var jugador = partido.jugadores[i];
	  		var lightJugador = usuarioService.toLightUser(jugador);
	  		lightJugadores.push(lightJugador);
	  	}
	  	var lightSuplentes = [];
	  	for (var i in partido.suplentes) {
	  		var jugador = partido.suplentes[i];
	  		var lightSuplente = usuarioService.toLightUser(jugador);
	  		lightSuplentes.push(lightSuplente);
	  	}
	  	var lightNoJuegan = [];
	  	for (var i in partido.nojuegan) {
	  		var jugador = partido.nojuegan[i];
	  		var lightNoJuega = usuarioService.toLightUser(jugador);
	  		lightNoJuegan.push(lightNoJuega);
	  	}
	  	var response = partidoService.construct(partido.nombre, partido.cancha, partido.fecha, partido.hora, partido.precio, partido.liga, lightJugadores, lightSuplentes, lightNoJuegan, partido.cantidadJugadores, partido.code);
  		return response;
	}
};

var ligaService = {
	construct : function (name, partidos, jugadores, ciudad, admins) {
		return {
			name : name, //name de la liga, funciona como Id
			partidos: partidos, //partidos activos, no se guarda el historial (borrar partidos viejos periodicamente)
			jugadores : jugadores, //jugadores inscriptos en la liga {name, email}
			ciudad: ciudad,  // ciudad a la que pertenece la liga
			admins : admins   // administradores de la liga
		}
	},
	saveLiga : function(liga,success,error) {
		DB.saveLiga(liga, success, error);
	},
	get: function(name,success,error) {
		DB.getLiga(name,success,error);
	},
	updateLiga : function(liga,success,error) {
		DB.updateLiga(liga, success, error);
	},
	exists : function(name,success,error){
		var onSuccess = function(data) {
			if (data) {
				success(true);
			}
			else {
				success(false);
			}
		};
		DB.getLiga(name,onSuccess,error);	
	},
	addJugador: function(liga, jugador, success, error) {
		var found = false;
		for (var index in liga.jugadores) {
			var mail = liga.jugadores[index];
			if (mail === jugador.email) {
				found = true;
				break;
			}
		}
		if (!found) {
			liga.jugadores.push( { name: jugador.name, email: jugador.email});	
			DB.updateLiga(liga, success, error);
		}
		else {
			success(liga);
		}
	},
	getPartidos: function(name, success, error) {
		var onSuccess = function(data) {
			if (data) {
				success(data.partidos);
			}
			else {
				success(null);
			}
		};
		DB.getLiga(name,onSuccess,error);	
	}
};
///////////////////////////////END SERVICES//////////////////////////////////////


//var serverURL = "http://localhost:8000";
var serverURL = "http://futbol5-2.jit.su";

var express = require('express');
var app = express()
  , server = require('http').createServer(app)
  , fs = require('fs')
  , locale = require("locale")
  , supported = new locale.Locales(["es", "en_US"]);

var nodemailer = require("nodemailer");
var chance = require('chance').Chance();
  
server.listen(8000);

app.use(express.json());
app.use(express.bodyParser());

app.use(locale(supported));

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/welcome.html');
});

app.get("/js/:which", function(req, res) {
	var file = __dirname + '/js/'+req.params.which;
    sendResponse(res,file);
});

app.get("/images/:which", function(req, res) {
	var file = __dirname + '/images/'+req.params.which;
    sendResponse(res,file);
});

app.get("/css/:which", function(req, res) {
	var file = __dirname + '/css/'+req.params.which;
    sendResponse(res,file);
});

app.get('/activar', function(req, res) {
    var onSuccess = function(data) {
    	res.sendfile(__dirname + '/jugadorActivado.html');	
    };
    var onError = function(error) {
    	var onSoccessGettingUser = function(user) {
    		res.sendfile(__dirname + '/jugador.html');		
    	};
    	var onErrorGettingUser = function() {
    		response404(res);		
    	};
    	usuarioService.get(req.query.code,onSoccessGettingUser,onErrorGettingUser);
    };
	usuarioService.activateUser(req.query.code, onSuccess, onError);
});

app.get('/jugador', function(req, res) {
	res.sendfile(__dirname + '/jugador.html');
});

app.get('/partidos', function(req, res) {
	res.sendfile(__dirname + '/partido.html');
});

app.get('/liga', function(req, res) {
	res.sendfile(__dirname + '/liga.html');
});

var response404 = function(res) {
	res.sendfile(__dirname + '/404.html');
};

var response500 = function(res) {
	res.writeHead(500, { "Content-Type": "text/plain" });
	res.end("Error 500: Internal Server Error!");
};

var sendResponse = function(res, file){
	fs.exists(file,function(exists){
		if (exists) {
			res.sendfile(file);
		}
		else {
			response404(res);
		}
	});  
};

/////////////////////////////////////////////////////////////////////



////////////////////////////START bootstrap////////////////////////////////////

/*var partidoTest = partidoService.construct("Partido Test","Cancha Test","28/03/2014","19:00","$60","test",[],[],[],10,"test");
partidoService.save(partidoTest,function(){
	console.log("Success");
},function(){
	console.log("Error");
});*/
//var usuarioTest = usuarioService.construct("Facundo Crego1","facundo.crego@gmail.com",3,"test","1");
//var usuarioTest2 = usuarioService.construct("Lionel Messi","facundo.crego@gmail.com",5,"test","2");
/*
var usuarioTest1 = usuarioService.construct("Test1","facundo.crego@gmail.com",5,"test","test1");
var usuarioTest2 = usuarioService.construct("Test2","facundo.crego@gmail.com",5,"test","test2");
var usuarioTest3 = usuarioService.construct("Test3","facundo.crego@gmail.com",5,"test","test3");
var usuarioTest4 = usuarioService.construct("Test4","facundo.crego@gmail.com",5,"test","test4");
var usuarioTest5 = usuarioService.construct("Test5","facundo.crego@gmail.com",5,"test","test5");
var usuarioTest6 = usuarioService.construct("Test6","facundo.crego@gmail.com",5,"test","test6");
var usuarioTest7 = usuarioService.construct("Test7","facundo.crego@gmail.com",5,"test","test7");
var usuarioTest8 = usuarioService.construct("Test8","facundo.crego@gmail.com",5,"test","test8");
var usuarioTest9 = usuarioService.construct("Test9","facundo.crego@gmail.com",5,"test","test9");
var usuarioTest10 = usuarioService.construct("Test10","facundo.crego@gmail.com",5,"test","test10");

var usuariosTest = [usuarioTest1,usuarioTest2,usuarioTest3,usuarioTest4,usuarioTest5,usuarioTest6,usuarioTest7,usuarioTest8,usuarioTest9,usuarioTest10]
for (var i in usuariosTest) {
	usuarioService.save(usuariosTest[i],function(){
		console.log("Success");
	},function(){
		console.log("Error");
});	
}*/
//partidoTest.jugadores.push(usuarioTest);
//partidoTest.jugadores.push(usuarioTest2);

//partidoService.save(partidoTest);

/*usuarioService.save(usuarioTest,function(){
	console.log("Success");
},function(){
	console.log("Error");
});*/
//usuarioService.save(usuarioTest2);
////////////////////////////END bootstrap////////////////////////////////////


///////////////////////////API UTILS//////////////////////////////////////////
var bodyHasRequiredProperties = function(body, properties){
	for (var i in properties) {
		var prop = properties[i];
		if(!body.hasOwnProperty(prop)) {
		    return false;
		} else {
			if (!body[prop]) {
				return false;
			}
		}
	}
	return true;
}
///////////////////////////API UTILS END//////////////////////////////////////////

/////////////////////////UTILS///////////

var Utils = {
	createCode : function() {
		return chance.string({length: 20, pool: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"});	
	}
}


/////////////////////////UTILS END///////////

app.post('/api/partidos', function(req, res) {
	console.log("API: POST /partidos");
	var requiredProperties = ["nombre","cancha","fecha","hora","precio","liga","cantidadJugadores"];
	if(!bodyHasRequiredProperties(req.body, requiredProperties)) {
	    res.statusCode = 400;
	    return res.json("Invalid request body");
	}
	
	var code = Utils.createCode();
	var partido = partidoService.construct(req.body.nombre,req.body.cancha,req.body.fecha,req.body.hora,req.body.precio,req.body.liga,[],[], [],req.body.cantidadJugadores,code);

	var onSuccess = function() {
		usuarioService.notificarNuevoPartido(partido, req.body.language);
	  	return res.json(true);	
	};
	var onError = function () {
		res.statusCode = 500;
		return res.json(false);
	};
	partidoService.save(partido,onSuccess,onError);
});

app.post('/api/partidos/:id/jugadores', function(req, res) {
	console.log("API: POST /partidos/{id}/jugadores");
	var requiredProperties = ["user","as"];
	if(!bodyHasRequiredProperties(req.body, requiredProperties)) {
	    res.statusCode = 400;
	    return res.json("Invalid request body");
	}
	var onSuccessGettingPartido = function(partido) {
		if (partido) {
			var onSuccess = function(usuario) {
				if (usuario) {
					var onSuccessAddingJugador = function(updatedData) {
						res.json(partidoService.toLightPartido(updatedData));	
					};

					var onErrorAddingJugador = function() {
						res.json(partidoService.toLightPartido(partido));		
					};

					partidoService.addJugador(partido, usuario, req.body.as, onSuccessAddingJugador, onErrorAddingJugador);
				}
				else {
					res.json(null);	
				}
			};
			var onError = function(error) {
				res.statusCode = 404;
				res.json(error);
			};
			usuarioService.get(req.body.user,onSuccess,onError);	
		}
		else {
			res.json(null);
		}
	};
	
	var onErrorGettingPartido = function(error){
		res.statusCode = 404;
		res.json(error);
	}
	partidoService.get(req.params.id,onSuccessGettingPartido,onErrorGettingPartido);
});

app.delete('/api/partidos/:id/jugadores', function(req, res) {
	console.log("API: DELETE /partidos/{id}/jugadores");
	var requiredProperties = ["user"];
	if(!bodyHasRequiredProperties(req.body, requiredProperties)) {
	    res.statusCode = 400;
	    return res.json("Invalid request body");
	}
	var onSuccessGettingPartido = function(partido) {
		var onSuccess = function(usuario) {
			var onSuccessRemoving = function() {
				res.json(partidoService.toLightPartido(partido));	
			};
			var onErrorRemoving = function() {
				res.json(false);
			};
			partidoService.removeJugador(partido, usuario.code, onSuccessRemoving,onErrorRemoving);
			
		};
		var onError = function(error) {
			res.statusCode = 404;
			res.json(error);
		};
		usuarioService.get(req.body.user,onSuccess,onError);
	};
	var onErrorGettingPartido = function(error) {
		res.statusCode = 404;
		res.json(error);
	};
	partidoService.get(req.params.id,onSuccessGettingPartido,onErrorGettingPartido);
});

app.get('/api/partidos/:id', function (req, res) {
  var code = req.params.id;
  console.log("getting partido "+code);
  var onSuccessGettingPartido = function(partido) {
  	res.json(partidoService.toLightPartido(partido));
  };
  var onErrorGettingPartido = function(error) {
  	return res.json(error);
  };
  partidoService.get(code,onSuccessGettingPartido,onErrorGettingPartido);
});

//Retorna el estado de un jugador para un partido.
app.get('/api/partidos/:id/voy', function (req, res) {
  var code = req.params.id;
  console.log("getting voy al partido "+code);

  var onSuccessGettingPartido = function(partido) {
  	//buscar en que lista esta anotado el jugador en el partido

  	var onSuccess = function(jugador) {
  		if (!jugador) {
  			res.statusCode = 404;
	 		return res.json({error : "Jugador no encontrado"});
  		}

  		for (var i in partido.jugadores) {
  			var titular = partido.jugadores[i];
  			if (titular.email === jugador.email) {
  				res.json( { as: "titular"});
  			}
  		}

  		for (var i in partido.suplentes) {
  			var suplente = partido.suplentes[i];
  			if (suplente.email === jugador.email) {
  				res.json( { as: "suplente"});
  			}
  		}

  		for (var i in partido.nojuegan) {
  			var nojuega = partido.nojuegan[i];
  			if (nojuega.email === jugador.email) {
  				res.json( { as: "nojuega"});
  			}
  		}

  		res.json( { as: null});
  	};
  	
  	var onError = function() {
		res.statusCode = 404;
	 	return res.json("Jugador no encontrado");	
  	};
	
	usuarioService.get(req.query.user,onSuccess,onError);
  };
  
  var onErrorGettingPartido = function(error) {
  	res.statusCode = 404;
	return res.json(error);
  };

  partidoService.get(code,onSuccessGettingPartido,onErrorGettingPartido);
  
});

app.get('/titular', function(req, res) {
	var partidoCode = req.query.code;
	var userCode = req.query.user;
	var onSuccessGettingPartido = function(partido) {
		if (partido) {
			var onSuccess = function(usuario) {
				if (usuario) {
					var onSuccessAddingJugador = function(updatedData) {
						res.sendfile(__dirname + '/partido.html');			
					};

					var onErrorAddingJugador = function() {
						response404(res);			
					};

					partidoService.addJugador(partido, usuario, "titular", onSuccessAddingJugador, onErrorAddingJugador);
				}
				else {
					response404(res);	
				}
			};
			var onError = function(error) {
				response404(res);			
			};
			usuarioService.get(userCode,onSuccess,onError);	
		}
		else {
			response404(res);			
		}
	};
	
	var onErrorGettingPartido = function(error){
		response404(res);			
	}
	partidoService.get(partidoCode,onSuccessGettingPartido,onErrorGettingPartido);
});

app.get('/suplente', function(req, res) {
	var partidoCode = req.query.code;
	var userCode = req.query.user;
	var onSuccessGettingPartido = function(partido) {
		if (partido) {
			var onSuccess = function(usuario) {
				if (usuario) {
					var onSuccessAddingJugador = function(updatedData) {
						res.sendfile(__dirname + '/partido.html');			
					};

					var onErrorAddingJugador = function() {
						response404(res);			
					};

					partidoService.addJugador(partido, usuario, "suplente", onSuccessAddingJugador, onErrorAddingJugador);
				}
				else {
					response404(res);	
				}
			};
			var onError = function(error) {
				response404(res);			
			};
			usuarioService.get(userCode,onSuccess,onError);	
		}
		else {
			response404(res);			
		}
	};
	
	var onErrorGettingPartido = function(error){
		response404(res);			
	}
	partidoService.get(partidoCode,onSuccessGettingPartido,onErrorGettingPartido);
});

app.get('/nojuega', function(req, res) {
	var partidoCode = req.query.code;
	var userCode = req.query.user;
	var onSuccessGettingPartido = function(partido) {
		if (partido) {
			var onSuccess = function(usuario) {
				if (usuario) {
					var onSuccessAddingJugador = function(updatedData) {
						res.sendfile(__dirname + '/partido.html');			
					};

					var onErrorAddingJugador = function() {
						response404(res);			
					};

					partidoService.addJugador(partido, usuario, "nojuega", onSuccessAddingJugador, onErrorAddingJugador);
				}
				else {
					response404(res);	
				}
			};
			var onError = function(error) {
				response404(res);			
			};
			usuarioService.get(userCode,onSuccess,onError);	
		}
		else {
			response404(res);			
		}
	};
	
	var onErrorGettingPartido = function(error){
		response404(res);			
	}
	partidoService.get(partidoCode,onSuccessGettingPartido,onErrorGettingPartido);
});

app.post('/api/registrarse', function(req, res) {
	console.log("API: POST /registrarse");
	var requiredProperties = ["nombre","email","liga"];
	if(!bodyHasRequiredProperties(req.body, requiredProperties)) {
	    res.statusCode = 400;
	    return res.json("Invalid request body");
	}

	var code = Utils.createCode();
	var ligas = [req.body.liga];
	var user = usuarioService.construct(req.body.nombre,req.body.email,3,ligas,code);

	var onSuccessSendEmail = function() {
		var onSuccessLigaExists = function(data) {
			if (data) {
				pendingUsers.push(user);
		  		res.json({});		
			}
			else {
				var liga = ligaService.construct(user.ligas[0], [], [], null, []);
				var onSuccessSaveLiga = function() {
					pendingUsers.push(user);
		  			res.json({});		
				};
				ligaService.saveLiga(liga, onSuccessSaveLiga, function() {
		  			res.json({error: "ERROR"});
		  		});
			}
		};
		ligaService.exists(user.ligas[0], onSuccessLigaExists, function() {
		  	res.json({error: "ERROR"});
		});
	};

	var onSuccessExists = function(data) {
		if (data) {
			res.json({error: "EXISTS"});
		}
		else {
			sendEmail(getWelcomeEmailOptions(user,req.body.language), onSuccessSendEmail, function() {
		  		res.json({error: "EMAIL"});
		  	});		
		}
	};

	var onErrorExists = function() {
		res.json(false);
	};

	usuarioService.exists(req.body.email, onSuccessExists, onErrorExists);
  	
});


app.get('/api/jugadores/:id', function (req, res) {
  var code = req.params.id;
  var onSuccess = function(jugador) {
  	if (jugador) {
  		console.log("jugador encontrado "+jugador.name);
  		res.json(jugador);
  	}
  	else {
  		res.statusCode = 404;
		return res.json("Jugador no encontrado");
  	}
  };
  var onError = function(error) {
  	res.statusCode = 404;
	return res.json(error);
  };
  usuarioService.get(code,onSuccess,onError);
});

//TODO chequear que solo pueda ver la liga quien es parte de la liga
app.get('/api/ligas/:name', function (req, res) {
  var name = req.params.name;
  var onSuccess = function(liga) {
  	if (liga) {
  		console.log("Liga encontrada "+liga.name);
  		res.json(liga);
  	}
  	else {
  		res.statusCode = 404;
		return res.json("Liga no encontrada");
  	}
  };
  var onError = function(error) {
  	res.statusCode = 404;
	return res.json(error);
  };
  ligaService.get(name,onSuccess,onError);
});

app.get('/api/ligas/:name/partidos', function (req, res) {
  var name = req.params.name;
  var onSuccess = function(partidos) {
  	if (partidos) {
  		res.json(partidos);
  	}
  	else {
  		res.statusCode = 404;
		return res.json("Liga no encontrada");
  	}
  };
  var onError = function(error) {
  	res.statusCode = 404;
	return res.json(error);
  };
  ligaService.getPartidos(name,onSuccess,onError);
});

/////////////////////////////START EMAIL//////////////////////////////////////////////

var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "futbol5server@gmail.com",
        pass: "321Azxc1"
    }
});

// setup e-mail data with unicode symbols
var getWelcomeEmailOptions = function(user, language) {
	console.log("Enviando welcome email en"+ language);
    var Labels = {    
		labels : {     
			message : {     
				es: "Hola "+user.name+", hace click en el link para activar la cuenta ",   
				"en-US": "Hi "+user.name+", click the link to activate the account. "    
			},      
			link : {     
				es: "Activar",   
				"en-US": "Activate"    
			}, 
			subject: {
				es: "Bienvenido a Futbol5!",   
				"en-US": "Welcome to Soccer5!"    
			}
		},    
        getLabel : function(labelId) {    
          return Labels.labels[labelId][language] || Labels.labels[labelId].es;    
        }     
	};      


	return {
	    from: "futbol5server@gmail.com", // sender address
	    to: user.email, // list of receivers
	    subject: Labels.getLabel("subject"), // Subject line
	    text: "Hola "+ user.name, // plaintext body
	    html: '<p>'+Labels.getLabel("message")+'</p> <br> <a href="'+serverURL+'/activar/?code='+user.code+'">'+Labels.getLabel("link")+'</a>'
	}
};

var getPartidoUpdateEmailOptions = function(user, as, partido, to) {

	var Labels = {    
		labels : {     
			titulares : {     
				es: "Titulares",
				"en-US": "Confirmed players"    
			},      
			suplentes : {     
				es: "Suplentes",
				"en-US": "Secondary players"    
			},      
			nojuegan : {     
				es: "No juegan",
				"en-US": "Not going players"    
			},      
			titularButton : {     
				es: "Voy",
				"en-US": "I'm in"    
			},      
			suplenteButton : {     
				es: "Suplente",
				"en-US": "Maybe"    
			},      
			nojuegaButton : {     
				es: "No juego",
				"en-US": "I'm not In"    
			},      
			link : {     
				es: "Ver partido",   
				"en-US": "See match"    
			}, 
			subject: {
				es: "Novedades del partido "+partido.nombre,   
				"en-US": "News of the match "+partido.nombre    
			},
			partidoInfo: {
				es: "Lugar "+partido.cancha+ ", fecha "+partido.fecha+" a las "+partido.hora,   
				"en-US": "Place "+partido.cancha+ ", on "+partido.fecha+" at "+partido.hora,    
			},
			userMessageAsTitular: {
				es: user.name + " ha sido anotado como titular.",   
				"en-US": user.name + " has been added to the match."    	
			},
			userMessageAsSuplente: {
				es: user.name + " ha sido anotado como suplente.",   
				"en-US": user.name + " has been added as secondary player to the match."    	
			},
			userMessageAsNoJuega: {
				es: user.name + " se bajo para el partido.",   
				"en-US": user.name + " is not going to the match."    	
			}
		},    
        getLabel : function(labelId) {    
          return Labels.labels[labelId][to.language] || Labels.labels[labelId].es;    
        }     
	};      

	//CSS taken from http://www.bestcssbuttongenerator.com/#/rsgIVQrKh2
	var buildButton = function() {
		var body ="";
		body+='<br> <a id="link" href="'+serverURL+'/titular?code='+partido.code+'&user='+to.code+'" style="-webkit-box-shadow: rgb(217, 251, 190) 0px 1px 0px 0px inset; box-shadow: rgb(217, 251, 190) 0px 1px 0px 0px inset; background-image: linear-gradient(rgb(165, 204, 82) 5%, rgb(184, 227, 86) 100%); background-color: rgb(165, 204, 82); border-top-left-radius: 6px; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-bottom-left-radius: 6px; border: 1px solid rgb(131, 196, 26); display: inline-block; cursor: pointer; color: rgb(255, 255, 255); font-family: arial; font-size: 15px; font-weight: bold; padding: 6px 24px; text-decoration: none; text-shadow: rgb(134, 174, 71) 0px 1px 0px; background-position: initial initial; background-repeat: initial initial; margin: 2px;">'+Labels.getLabel("titularButton")+' </a>';
		body+='<a id="link" href="'+serverURL+'/suplente?code='+partido.code+'&user='+to.code+'" style="-webkit-box-shadow: rgb(252, 226, 193) 0px 1px 0px 0px inset; box-shadow: rgb(252, 226, 193) 0px 1px 0px 0px inset; background-image: linear-gradient(rgb(251, 158, 37) 5%, rgb(255, 196, 119) 100%); background-color: rgb(251, 158, 37); border-top-left-radius: 6px; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-bottom-left-radius: 6px; border: 1px solid rgb(238, 180, 79); display: inline-block; cursor: pointer; color: rgb(255, 255, 255); font-family: arial; font-size: 15px; font-weight: bold; padding: 6px 24px; text-decoration: none; text-shadow: rgb(204, 159, 82) 0px 1px 0px; background-position: initial initial; background-repeat: initial initial; margin: 2px;">'+Labels.getLabel("suplenteButton")+' </a>';
		body+='<a id="link" href="'+serverURL+'/nojuega?code='+partido.code+'&user='+to.code+'" style="-webkit-box-shadow: rgb(245, 151, 142) 0px 1px 0px 0px inset; box-shadow: rgb(245, 151, 142) 0px 1px 0px 0px inset; background-image: linear-gradient(rgb(198, 45, 31) 5%, rgb(242, 69, 55) 100%); background-color: rgb(198, 45, 31); border-top-left-radius: 6px; border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-bottom-left-radius: 6px; border: 1px solid rgb(208, 39, 24); display: inline-block; cursor: pointer; color: rgb(255, 255, 255); font-family: arial; font-size: 15px; font-weight: bold; padding: 6px 24px; text-decoration: none; text-shadow: rgb(129, 14, 5) 0px 1px 0px; background-position: initial initial; background-repeat: initial initial; margin: 2px;">'+Labels.getLabel("nojuegaButton")+'</a>';
		return body;
	};

	var buildMailBodyHTML = function() {
		var i = 1;
		var body = "";
		body+="<div>"+Labels.getLabel("partidoInfo")+ "</div><br>";
		body+=buildButton();
		if (as == "titular") {
		   body += "<div>"+Labels.getLabel("userMessageAsTitular")+ "</div>";
		}
		if (as == "suplente") {
		   body += "<div>"+Labels.getLabel("userMessageAsSuplente")+ "</div>";
		} 
		if (as == "nojuega") {
		   body += "<div>"+Labels.getLabel("userMessageAsNoJuega")+ "</div>";
		} 
		body += "<br><div><strong>" + Labels.getLabel("titulares") + "</strong>";
		for (var index in partido.jugadores){
			var jugador = partido.jugadores[index];
			body += "<div>"+i+": "+jugador.name+"</div>";
			i++;
		}
        while (i <= partido.cantidadJugadores) {
            body+="<div>  "+i+": ? </div>";
            i++; 
        }
		body += "<br></div><strong>"+Labels.getLabel("suplentes") + "</strong>";
		body += "<div>";

		for (var index in partido.suplentes){
			var jugador = partido.suplentes[index];
			body += "<div>  "+jugador.name+"</div>";
		}
		body += "</div>";
		body += "<br><div><strong>"+Labels.getLabel("nojuegan") + "</strong>";
		for (var index in partido.nojuegan){
			var jugador = partido.nojuegan[index];
			body += "<div>  "+jugador.name+"</div>";
		}
		body += "</div>";
		return body;
	};


	return {
	    from: "futbol5server@gmail.com", // sender address
	    to: to.email, // list of receivers
	    subject: Labels.getLabel("subject"), // Subject line
	    text: "Hola "+ user.name, // plaintext body
	    html: buildMailBodyHTML()+'<br> <a id="link" href="'+serverURL+'/partidos?code='+partido.code+'&user='+to.code+'">'+Labels.getLabel("link")+'</a>'
	}
};

var getPartidoInvitationEmailOptions = function(user, partido, language) {

	var Labels = {    
		labels : {     
			message : {     
				es: "Hola "+user.name+", accede al partido en el siguiente link. ",   
				"en-US": "Hi "+user.name+", see the match following this link. "    
			},      
			link : {     
				es: "Ver partido",   
				"en-US": "See match"    
			}, 
			subject: {
				es: "Invitacion al partido "+partido.nombre,   
				"en-US": "Invite to the match "+partido.nombre    
			}
		},    
        getLabel : function(labelId) {    
          return Labels.labels[labelId][language] || Labels.labels[labelId].es;    
        }     
	};      


	return {
	    from: "futbol5server@gmail.com", // sender address
	    to: user.email, // list of receivers
	    subject: Labels.getLabel("subject"), // Subject line
	    text: "Hola "+ user.name, // plaintext body
	    html: '<p>'+Labels.getLabel("message")+'</p> <br> <a id="link" href="'+serverURL+'/partidos?code='+partido.code+'&user='+user.code+'">'+Labels.getLabel("link")+'</a>'
	}
};

// send mail with defined transport object
var sendEmail = function (email, onSuccess, onError) {
	console.log("Sending email to "+ email.to);
	smtpTransport.sendMail(email, function(error, response) {
	    if(error) {
	        console.log(error);
	        if (onError)
	        	onError();
	    }else{
	        if (onSuccess)
	        	onSuccess();
	    }

	    // if you don't want to use this transport object anymore, uncomment following line
	    //smtpTransport.close(); // shut down the connection pool, no more messages
	});
};

/////////////////////////////END EMAIL//////////////////////////////////////////////

var schedule = require('node-schedule');

var isMatchCloseToStart = function(date) {
	var today = new Date();
	if (today.getFullYear() == date.getFullYear()){
		if (today.getMonth() == date.getMonth()) {
			date.setDate(date.getDate()-2)
			if (date < today) {
				console.log("Notificar a los miembros de la liga del nuevo partido");
			}
		}
	}
}

var job = schedule.scheduleJob({hour: 00, minute: 50, dayOfWeek: new schedule.Range(0, 6)}, function(){
    console.log('Time to check matches close to start.');
    var onGetAllPartidos = function(partidos) {
    	var today = new Date();
    	for (var i in partidos) {
    		var partido = partidos[i];
    		var partidoDate = new Date(partido.fecha);
    		if (partidoDate != 'Invalid Date') {
    			if ( partidoDate < new Date()) {
    				
    			}	
    		}
    	}
    };
    var onError = function(error) {
    	console.log("No se ejecuta el job. Error obteniendo partidos.");
    };
    partidoService.getAll(onGetAllPartidos, onError);
});

console.log("Server Started at "+serverURL);