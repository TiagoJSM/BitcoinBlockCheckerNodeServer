'use strict';

var crypto = require('crypto');
var http = require('https');

Array.prototype.last = function() {
    return this[this.length-1];
}

var defaultHashPrevBlock = "0000000000000000000000000000000000000000000000000000000000000000";

function getBlock(id, successCallback, errorCallback){
	return http.get({
        host: 'blockexplorer.com',
        path: '/api/block/' + id
    }, function(response){
		var block = '';
        response.on('data', function(d) {
            block += d;
        }).on('end', function() {
            if(response.statusCode == 200){
                successCallback(JSON.parse(block)); 
                return;   
            }
			errorCallback();
        });
	})
	.end()
	.data;
}

function reverseHexString(s){
	return s.match(/.{2}/g).reverse().join("");
}

function doubleHash(data){
	var hashed = 
		crypto.createHash('sha256').update(
			crypto.createHash('sha256').update(data).digest())
			.digest("hex");
	return hashed;
}

function getMerkleRootAux(transactions){
	if(transactions.length == 1){
		return transactions[0];
	}
	var combinedTransactions = []
	if(transactions.length % 2 != 0){
		transactions.push(transactions.last());
	}
    
	for(var idx = 0; idx < transactions.length; idx+=2){
		var buffers = [new Buffer(reverseHexString(transactions[idx]), 'hex'), new Buffer(reverseHexString(transactions[idx + 1]), 'hex')];
		combinedTransactions.push(reverseHexString(doubleHash(Buffer.concat(buffers))));
	}
	return getMerkleRootAux(combinedTransactions);
}

function getMerkleRoot(genesisBlock){
	var transactions = genesisBlock.tx.slice();
	return reverseHexString(getMerkleRootAux(transactions));
}

function buildBlockHeader(genesisBlock){
	var buffer = new Buffer(4);
	buffer.fill(0);
	buffer.writeUInt32LE(genesisBlock.version);
	
	var merkleroot = getMerkleRoot(genesisBlock);	
	var time = reverseHexString(genesisBlock.time.toString(16));
	var bits = reverseHexString(genesisBlock.bits);
	var nonce = reverseHexString(genesisBlock.nonce.toString(16));
	var hashPrevBlock = typeof genesisBlock.previousblockhash == 'undefined' ? defaultHashPrevBlock : reverseHexString(genesisBlock.previousblockhash);
	
	return buffer.toString('hex') + hashPrevBlock +	merkleroot + time + bits + nonce;
}
	
function verifyHash(genesisBlock){
	var blockHeader = buildBlockHeader(genesisBlock);
	var buffer = new Buffer(blockHeader, 'hex');
	var data = doubleHash(buffer);
	return reverseHexString(data) == genesisBlock.hash;
}

exports.verify = function(id, successCallback, errorCallback){
    getBlock(
        id, 
        function(genesisBlock){
            successCallback(verifyHash(genesisBlock));
        },
        errorCallback);
}
