module.exports = function encodeWebSocket(bytesRaw, needsMask){
	const maskingKey = 456112120;

    var bytesFormatted = new Array();
    bytesFormatted[0] = 129; // hex 81, bin 10000001 = FIN 1 and opcode 1
    if (bytesRaw.length <= 125) {

			bytesFormatted[1] = (needsMask)? bytesRaw.length + 128 : bytesRaw.length;

    } else if (bytesRaw.length >= 126 && bytesRaw.length <= 65535) {

				bytesFormatted[1] = (needsMask)? 126 + 128 : 126;

        bytesFormatted[2] = ( bytesRaw.length >> 8 ) & 255; // 255 = 11111111
        bytesFormatted[3] = ( bytesRaw.length      ) & 255;
    } else {

				bytesFormatted[1] = (needsMask)? 127 + 128 : 127;

        bytesFormatted[2] = ( bytesRaw.length >> 56 ) & 255;
        bytesFormatted[3] = ( bytesRaw.length >> 48 ) & 255;
        bytesFormatted[4] = ( bytesRaw.length >> 40 ) & 255;
        bytesFormatted[5] = ( bytesRaw.length >> 32 ) & 255;
        bytesFormatted[6] = ( bytesRaw.length >> 24 ) & 255;
        bytesFormatted[7] = ( bytesRaw.length >> 16 ) & 255;
        bytesFormatted[8] = ( bytesRaw.length >>  8 ) & 255;
        bytesFormatted[9] = ( bytesRaw.length       ) & 255;
    }

		if (needsMask) {

			// add mask - temp solution - fix later
			[171, 133, 102, 17].forEach(num => {
				bytesFormatted.push(num);
			});

			// mask in hex
			var masks = [0xab, 0x85, 0x66, 0x11];

			for (var i = 0; i < bytesRaw.length; i++) {
		    bytesFormatted.push(bytesRaw.charCodeAt(i) ^ masks[i % 4]);
		  }

		} else {

			for (var i = 0; i < bytesRaw.length; i++) {
	      bytesFormatted.push(bytesRaw.charCodeAt(i));
			}

		}

		return bytesFormatted;
}
