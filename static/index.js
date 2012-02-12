
debug_response = function(json) {
  var message = JSON.parse(json);
  console.log(message);
}

sendAjaxJsonMessage = function(path, opt_object, opt_callback, opt_this) {
  $.ajax({
      url: path,
      type: 'POST',
      data: opt_object,
      success: function(data) {
        opt_callback.call(opt_this, data);
      }
  });
};

Controller = function() {};

Controller.prototype.send_input = function() {
  this.input = this.input_codemirror.getValue();
  this.input_codemirror.setValue('');
  var message = {};
  message.input = this.input;
  sendAjaxJsonMessage('/input_new', message, this.ack, this);
  console.log('sending', message);
};

Controller.prototype.ack = function(message) {
  if (message.status == 'ok') {
    this.extend_output(this.input);
  } else {
    this.undo();
  }
};


Controller.prototype.extend_output = function(message) {
  this.output_codemirror.setValue(
    this.output_codemirror.getValue() + '\n' + message);
  this.output_codemirror.setCursor(this.output_codemirror.lineCount());
}

Controller.prototype.message_received = function(message) {
  console.log(message);
  this.extend_output(message.newoutput);
}

Controller.prototype.undo = function() {
  this.input_codemirror.setValue(this.input);
  this.input = '';
};

onload = function() {  
  controller = new Controller();

  var output = CodeMirror.fromTextArea(document.getElementById("output2"), {
    lineNumbers: true,
    readOnly: true,
  });
  output.setCursor(output.lineCount());

  var input = CodeMirror.fromTextArea(document.getElementById("input2"), {
    lineNumbers: false,
    indentUnit: 4,
    onKeyEvent:
      function(editor, e) {
          if (e.keyCode === 13 && e.type === 'keydown' && e.shiftKey) {
              controller.send_input();
              return true;
          }
          if (e.keyCode === 13 && e.type === 'keyup' && e.shiftKey) {
              return true;
          }
      }
  });
  controller.input_codemirror = input;
  controller.output_codemirror = output;

  var onMessage = function(messageObject) {
    var message = JSON.parse(messageObject.data);
    controller.message_received(message);
  }

  var onOpened = function() {
    console.log('channel established');
  }

  var onError = function(error) {
    console.log('channel error', error);
  }

  var onClose = function() {
    console.log('channel closed');
  }

  var channel = new goog.appengine.Channel(token);
  var socket = channel.open();
  socket.onopen = onOpened;
  socket.onmessage = onMessage;
  socket.onerror = onError;
  socket.onclose = onClose;
}

document.addEventListener('onload', onload);
