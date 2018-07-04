module.exports = function decodeWebSocket(data, noMask){
  var datalength = data[1] & 127;
	var output = "";
	let i;

	if (noMask) {

		for (i = 2; i < data.length; i++) {
			output += String.fromCharCode(data[i]);
		}

	} else {

		var indexFirstMask = 2;
	  if (datalength == 126) {
	    indexFirstMask = 4;
	  } else if (datalength == 127) {
	    indexFirstMask = 10;
	  }
	  var masks = data.slice(indexFirstMask,indexFirstMask + 4); // slice does not modify original arr
	  i = indexFirstMask + 4;
	  var index = 0;

		while (i < data.length) {
	    output += String.fromCharCode(data[i++] ^ masks[index++ % 4]);
	  }
	}

  return output;
}
