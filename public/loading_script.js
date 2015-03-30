var conversation = [];
$(document).ready(function() {	
	$('#chatBar').change(function(ev) {
		var el = $(ev.target);
		sendMessage(el.val());
		el.val('');
	});
	$("#clearChat").click(function(ev) {
		ev.preventDefault();	
		var el = $(ev.target);
		conversation = [];
		load_convo(conversation);			
		inProgress = true;			
	});
});
var inProgress = false;
var bubbleMake = function(data, author) {
	return (
		'<div class="chat-bubble'+(author!="other"?" self":"")+'">' +
		'<div class="chat-bubble-glare"></div>' +
			'<p>'+data+'</p>' +
			'<div class="chat-bubble-arrow-border"></div>' +
			'<div class="chat-bubble-arrow"></div>' +
		'</div>'
	);
};
// socket.io specific code
var socket = io.connect();      
var handler = function (el, location, update) {
	saveNode(el, location, update, true);	
};
socket.on('user message', handler);
var handleDelete = function(keys) {
	performDelete(keys, true);
};
var getMessage = function(content) {
	conversation.push({ user: "other", content: content });
	load_convo(conversation);
	
	var objDiv = document.getElementById("chatText");
	objDiv.scrollTop = objDiv.scrollHeight;
};
var sendMessage = function(content) {	
	conversation.push({ user: user.name, content: content });
	load_convo(conversation);
	var objDiv = document.getElementById("chatText");
	objDiv.scrollTop = objDiv.scrollHeight;

	socket.emit(_chat, content);
};

var gotJSON = false,
	handleJSON = function(noteInfo) {		
		if( !gotJSON && noteInfo.content ) {						
			note = noteInfo.content; 
			$('#notePad').html('');
			load_note(note);
			conversation = noteInfo.comments;
			load_convo(noteInfo.comments);
			gotJSON = true;		
		}
	};

//System bindings
socket.on('connect', function () {
	$('#notePad').append("<br>Connected<br>");
	socket.emit(_event.replace(" message","")+' data request', _event.replace(" message",""));
	//$('#chat').addClass('connected');
});
socket.on('reconnect', function () {
	/*$('#lines').remove();
	message('System', 'Reconnected to the server');*/
});
socket.on('reconnecting', function () {
	//message('System', 'Attempting to re-connect to the server');
});		
socket.on('error', function (e) {
	//message('System', e ? e : 'A unknown error occurred');
});

var user = {
		name: "Matt Neary"
};   			      		
var Node = function(content) {
	var templ = {
		content: content,
		contributor: user.name,
		approved: true,
		children: []
	};
	for( var k in templ )
		this[k] = templ[k];			      							      			
};
var push_ro = function(array, val) {
	return ((r = array.map(function(v) { return v; })).push(val), r);
};    
var find_by_keys = function(ctx, keys, edit, append) {
	var node = ctx; 
	keys.map(function(v) { 
		node = node.children ? node.children[v] : node[v];
	}); 
	if( edit ) {
		if( append )
			node[edit.key].push(edit.value);
		else
			node[edit.key] = edit.value;
	}
	return node;
}; 		
var deleteAtKeys = function(ctx, keys) {
	var node = ctx,
		keyString = "";
	keys.map(function(v) { 
		node = node.children ? (keyString+=".children['"+v+"']", node.children[v]) : (keyString+="['"+v+"']", node[v]);		
	}); 
	Function("delete note"+keyString)();
};
var performInsert = function(el) {
	var keys = $(el).data("keys");//.siblings(".label")
	var context = find_by_keys(note, (""+keys).split(","));
	displayEditing(keys,1);
	return false;
};	   
var performDelete = function(keys, alreadySync) {
	//Synchronize
	keys = keys+'';
	deleteAtKeys(note, keys.split(","));
	$("#notePad").html('');
	load_note(note);
	
	if( !alreadySync ) socket.emit(_delete, keys);
	return false;
};	   
var saveNode = function(text, location, update, alreadySync) {			      			
	find_by_keys(note, location.split(","), {
		key: update?"content":"children",
		value: update?text:new Node(text)
	}, !update);
	
	$("#notePad").html('');
	load_note(note);
	if( !alreadySync ) socket.emit(_event, text, location, update);
	
	inProgress = true;
};  
var displayEditing = function(keys,child) {
	var i = 0,
	query = "a[data-keys"+(child?'^':'')+"='"+keys+",']";
	while( i++ || $(query)[i-1] ) {
		if( !$(query)[i-1] )
			break;
	}
	var lastIndex = i;
	var lastItem = $(query)[i-2] || $("a.warning[data-keys='"+keys+"']");
	
	var depth = (""+keys).split(',').length;
	if( child )
		$('<h'+((depth+2)>5 ? 5 : depth+2 )+'>'+Array(8*depth).join("&nbsp;")+'<input type="text">&nbsp;<a class="btn" onclick=\'saveNode($(this).siblings("input").val(), "'+keys+'")\'>Insert</a></h'+((depth+2)>5 ? 5 : depth+2 )+'>').insertAfter(lastItem);
	else
		$(lastItem.parents('*')[1]).replaceWith($('<h'+((depth+1)>5 ? 5 : depth+1 )+'>'+Array(8*depth-8).join("&nbsp;")+'<input type="text" value="'+$(lastItem.parents("*")[1]).html().split('<')[0].replace(/&nbsp;/g, '')+'">&nbsp;<a class="btn" onclick=\'saveNode($(this).siblings("input").val(), "'+keys+'", 1)\'>Insert</a></h'+((depth+1)>5 ? 5 : depth+1 )+'>'));
	return false;
}; 		
var saveNote = function() {
	socket.emit(_save, note, conversation);
	inProgress = false;
};

window.onbeforeunload = function (evt) {
	var message = 'Unsaved Progress!';
	if (typeof evt == 'undefined') {
		evt = window.event;
	}
	if (evt) {
		evt.returnValue = message;
	}
	return inProgress ? message : null;
}
	
var load_convo = function(convo) {
	$("#chatText").html('');
	$().append.apply($("#chatText"), convo.map(function(v,i) { return bubbleMake(v.content,v.user==user.name?user.name:"other"); }));
	
	var objDiv = document.getElementById("chatText");
	objDiv.scrollTop = objDiv.scrollHeight;
};
	
var load_note = function(note,depth,keys) {
	depth = depth || 0;
	keys = keys || [];
	for( var k in note ) {
		var node = note[k];
		if( node ) {
			$("#notePad").append(			
				"<h"+((depth+2)>5 ? 5 : depth+2 )+">"+Array((depth)*8).join("&nbsp;")+
					node.content+
					"<small>"+
						Array(8).join("&nbsp;")+																						
						"</a>"+
						"&nbsp;<a href='#' onClick='return performInsert(this)' class='label success' data-keys='"+push_ro(keys, k)+"' data-depth='"+depth+"' data-index='"+k+"' data-placement='below' rel='twipsy'>↳ new</a>"+
						"&nbsp;<a href='#' onClick='return performDelete($(this).data(\"keys\"))' class='label important' data-keys='"+push_ro(keys, k)+"' data-depth='"+depth+"' data-index='"+k+"' data-placement='below' rel='twipsy'>- delete</a>"+		
						"&nbsp;<a href='#' onClick='return displayEditing($(this).data(\"keys\"))' class='label warning' data-keys='"+push_ro(keys, k)+"' data-depth='"+depth+"' data-index='"+k+"' data-placement='below' rel='twipsy'>✏ edit</a>"+	
					"</small>"+
				"</h"+((depth+2)>5 ? 5 : depth+2 )+">"
			);										      		
			var more = !node.children || arguments.callee(node.children, depth+1, push_ro(keys, k));
		}
	}
}
load_note(note);