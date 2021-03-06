const request = require("request");
const NodeHelper = require("node_helper");
const url = require("url");

module.exports = NodeHelper.create({

	start: function() {
		var self = this;
		console.log("Starting node helper: " + this.name);

                this.expressApp.get('/openhab', (req, res) => {

                        var query = url.parse(req.url, true).query;
			var payload = { item: query.item, state: query.state, timestamp: new Date() };

                        if (query.item == null || query.state == null) {
                                res.send({ status: "failed", error: "item and/or state is missing", payload: payload});
                        } else {
                                self.sendSocketNotification("OPENHAB_ITEM", payload);
                                res.send({ status: "success", payload: payload });
                        }
                });
        },
	
	socketNotificationReceived: function(notification, openhab) {
		// continue only if it is a get request for an openhab group
		if (notification == "GET_OPENHAB_ITEMS") {

			// build request params: url and optionally basic authentication
			var requestParams = this.buildRequestParams(openhab);

			var self = this;
			// console.log("Requesting items on openhab server: " + requestParams);
			request(requestParams, function(error, response, body) {
				if (!error && response.statusCode == 200) {
					self.sendSocketNotification("OPENHAB_ITEMS", JSON.parse(body));
				} else {
					console.log("Request on openhab server failed (" + response.statusCode + "): " + error);
				}
			});
		} else {
			console.log("Unknown notification: " + notification);
		}
	},

	buildRequestParams: function(openhab) {
		// build url of openhab server to get status of group items in json format
		var url = openhab.url;
		if (!url.endsWith('/'))
			url += '/';
		url += "rest/items?type=json";

		if (openhab.user && openhab.password) {

			// if user and password are set, perform request with basic authentication!
			var auth = "Basic " + new Buffer(openhab.user + ":" + openhab.password).toString("base64");

			return { url: url, headers: { "Authorization" : auth } };
		} else {
			return { url: url };
		}		
	},
});

