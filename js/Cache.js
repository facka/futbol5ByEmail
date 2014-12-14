// Constructor
function Cache() {
	// always initialize all instance properties
	this.items = {};
	this.count = 0;
	this.maxItems = 100;
	this.order = [];
};
// class methods
Cache.prototype.get = function(id) {
	return this.items[id];
};
Cache.prototype.update = function(id, item) {
	if (this.items[id]) {
		this.items[id] = item;
	}
	else {
		if (this.count < this.maxItems) {
			this.order.push(id);
			this.items[id] = item;		
			this.count++;
		}
		else {
			var old = this.order[0];
			this.order.splice(0,1);
			delete this.items.old;
			this.items[id] = item;
			this.order.push(id);
		}
	}
	 
};
Cache.prototype.remove = function(id) {
	delete this.items[id];
	this.count--;
};

// export the class
module.exports = Cache;